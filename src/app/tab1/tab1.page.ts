import { Component } from '@angular/core';

import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { ActionSheetController } from '@ionic/angular';

export interface MyData {
  name: string;
  filepath: string;
  size: number;
}
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  // tarefa de Upload  
  task: AngularFireUploadTask;

  // Progress em porcentagem
  percentage: Observable<number>;

  // Snapshot do arquivo de upload "cópia".
  snapshot: Observable<any>;

  // URL do arquivo de upload
  UploadedFileURL: Observable<string>;

  //Lista de imagens
  images: Observable<MyData[]>;

  //detalhes do File
  fileName:string;
  fileSize:number;

  //checagem de Status
  isUploading:boolean;
  isUploaded:boolean;

  //arquivos de imagens no firebase firestore
  private imageCollection: AngularFirestoreCollection<MyData>;

  constructor(
    private storage: AngularFireStorage,
    private database: AngularFirestore,
    public actionSheetController: ActionSheetController
    ) 
    {
      this.isUploading = false;
      this.isUploaded = false;
      //Define a coleção onde nossas informações de documentos / imagens serão salvas
      this.imageCollection = database.collection<MyData>('photos');
      //Se a coleção sofrer modificações recebo os dados atualizados.
      this.images = this.imageCollection.valueChanges();
    }

  //envia os arquivos
  uploadFile(event: FileList) {

    // O object do arquivo
    const file = event.item(0);

    // Validando como imagem
    if (file.type.split('/')[0] !== 'image') { 
     console.error('unsupported file type :( ')
     return;
    }

    this.isUploading = true;
    this.isUploaded = false;


    this.fileName = file.name;

    // Caminho no storage
    const path = `photos/${new Date().getTime()}_${file.name}`;

    // Metadados totalmente opcionais
    const customMetadata = { app: 'Photo-app Demo - Image Upload' };

    //Referência do arquivo
    const fileRef = this.storage.ref(path);

    // A tarefa princial
    this.task = this.storage.upload(path, file, { customMetadata });

    // Obter porcentagem de progresso do arquivo
    this.percentage = this.task.percentageChanges();
    this.snapshot = this.task.snapshotChanges().pipe(
      finalize(() => {
        // Obter caminho de armazenamento de arquivo carregado
        this.UploadedFileURL = fileRef.getDownloadURL();

        this.UploadedFileURL.subscribe(resp=>{
          this.addImagetoDB({
            name: file.name,
            filepath: resp,
            size: this.fileSize
          });
          this.isUploading = false;
          this.isUploaded = true;
        },error=>{
          console.error(error);
        })
      }),
      tap(snap => {
          this.fileSize = snap.totalBytes;
      })
    )
  }

  addImagetoDB(image: MyData) {
    //Crie um ID para o documento
    const id = this.database.createId();

    //Definir identificação do documento com valor no banco de dados
    this.imageCollection.doc(id).set(image).then(resp => {
      console.log(resp);
    }).catch(error => {
      console.log("error " + error);
    });
  }

  public async showActionSheet(photo, position) {  
    const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          //falta escrever o método de delete
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          // Nothing to do, action sheet is automatically closed
         }
      }]
    });
    await actionSheet.present();
  }

  public async deletePhotos(file){
    //decidir como implementar de forma simples.
  }
  

}
