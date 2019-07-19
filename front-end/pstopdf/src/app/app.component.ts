import { Component, OnInit } from '@angular/core';
import { ConvertService } from './services/convert.service';
import {  FileUploader, FileSelectDirective } from 'ng2-file-upload/ng2-file-upload';


const URL = 'http://localhost:4000/api/upload';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'pstopdf';
  files: any = [];
  aceptableTypes = [
    'application/pdf',
    'application/ps'
  ];

  constructor(private ConvertService: ConvertService){}


  public uploader: FileUploader = new FileUploader({url: URL, itemAlias: 'photo'});

  public hasBaseDropZoneOver:boolean = false;
  public hasAnotherDropZoneOver:boolean = false;
 
  public fileOverBase(e:any):void {
    this.hasBaseDropZoneOver = e;
  }
 
  public fileOverAnother(e:any):void {
    this.hasAnotherDropZoneOver = e;
  }
  ngOnInit() {
    this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; };
    this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
         console.log('ImageUpload:uploaded:', item, status, response);
      
    };

    
 }


 
  uploadFile(event) {
    
    for (let index = 0; index < event.length; index++) {
      const element = event[index];
      if (this.aceptableTypes.indexOf(element.type) > -1) {
        this.files.push(element)
      } else {
        alert("Incorrect format, only place PS or PDF");
      }

    }
  }
  deleteAttachment(index) {
    this.files.splice(index, 1);
  }

  sendFilesToConvert() {
    console.log("Enviando arquivos!");
    for (let f of this.files) {
      this.upload(f);
     if (f.type == 'application/pdf') {
        //this.convertFilePDF(f);
        
      }
      if (f.type == 'application/ps') {
        //this.convertFilePS(f);
      }
    }
  }

  upload(file){
    const formData = new FormData();
    formData.append('file', file);
    console.log("upload");
    this.ConvertService.upload(formData).subscribe(
      (res) =>console.log(res),
      (err) => console.log(err)
    );
  }
  convertFilePS(file){
    console.log("ConvertFilePS")
    return this.ConvertService.convertFilePS(file).subscribe(
      (data)=>{

    },
    err =>{

    },
    ()=>{

    }
    );
  }

  convertFilePDF(file){
    console.log("ConvertFilePDF")
    return this.ConvertService.convertFilePDF(file).subscribe(
      (data)=>{

    },
    err =>{

    },
    ()=>{
      
    }
    );
  }


}
