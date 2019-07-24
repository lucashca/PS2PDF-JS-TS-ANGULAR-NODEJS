import { Component, OnInit } from '@angular/core';
import { ConvertService } from './services/convert.service';
import { FileUploader, FileSelectDirective } from 'ng2-file-upload/ng2-file-upload';
import { throwIfEmpty } from 'rxjs/operators';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'pstopdf';
  files: any = [];
  dataWorkers: any = [];

  downloadLinks = [];
  nameFiles = [];
  aceptableTypes = [
    'application/pdf',
    'application/ps'
  ];

  noResponse = true;

  onceTime = false;
  oldQueueLenght = 0;
  // tslint:disable-next-line: no-shadowed-variable
  constructor(private ConvertService: ConvertService) { }


  public uploader: FileUploader;
  public hasBaseDropZoneOver = false;
  public hasAnotherDropZoneOver = false;

  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  public fileOverAnother(e: any): void {
    this.hasAnotherDropZoneOver = e;
  }
  donwloadURL = this.ConvertService.serverUrlDownload;

  ngOnInit() {

    this.initUploader() ;
  }

  initUploader() {
    this.uploader = new FileUploader(
      {
        url: this.ConvertService.serverUrlUpload,
        disableMultipart: false,
        autoUpload: false,
        method: 'post',
        itemAlias: 'file',
        allowedMimeType: ['application/pdf', 'application/postscript']
      });

      // tslint:disable-next-line: align
      this.uploader.onAfterAddingFile = (file) => {
        file.withCredentials = false;

      };
    this.uploader.onCompleteItem = async (item: any, response: any, status: any, headers: any) => {
        await this.resolveAfterXSeconds(5);
        console.log(response);
        const data = JSON.parse(response);
        console.log('Respos');
        console.log(item.file.name);
        this.nameFiles.push({fn: data.fileName, on:item.file.name});

        if ( this.uploader.progress == 100) {
          await this.resolveAfterXSeconds(2);
          if(!this.onceTime){
            this.getFilesConverted();
            this.getStatusNetwork();
            this.endUpload();
            this.onceTime = true;
            await this.resolveAfterXSeconds( this.oldQueueLenght/5);
            this.initUploader();
          }    
        }
      };

  }
  async getFilesConverted(){
    await this.resolveAfterXSeconds(5);
    while(this.noResponse){ 
      this.noResponse = false;
      for(let n of  this.nameFiles){
        this.getMyConverted(n.fn, n.on);
      }
      await this.resolveAfterXSeconds(2);
    }
  }

  getDataWorkers() {
    return this.ConvertService.getDataWorkers().subscribe(
      (data) => {
        this.dataWorkers = data;
        console.log('daat' + data);
      }, err => {

      },
      () => {

      });
  }


  async getStatusNetwork() {
    await this.resolveAfterXSeconds(5);
    while (true) {
      this.getDataWorkers();
      await this.resolveAfterXSeconds(2);
    }
  }
  async onConverterClick() {
    this.noResponse = true;
    this.onceTime = false;
    this.downloadLinks = [];
    this.nameFiles = [];
    this.uploader.uploadAll();
    this.oldQueueLenght = this.uploader.queue.length;
    while (this.uploader.progress != 100) { await this.resolveAfterXSeconds(5); }
    for (const i of this.uploader.queue) {
      const oName = i.file.name;
      const down = { name: oName, link: null };
      this.downloadLinks.push(down);
    }

  }
  uploadFile(event) {

    // tslint:disable-next-line: prefer-for-of
    for (let index = 0; index < event.length; index++) {
      const element = event[index];
      if (this.aceptableTypes.indexOf(element.type) > -1) {
        this.files.push(element);
      } else {
        alert('Incorrect format, only place PS or PDF');
      }

    }
  }
  deleteAttachment(index) {
    this.files.splice(index, 1);
  }

  resolveAfterXSeconds(x) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(x);
      }, x * 1000);
    });
  }

  sendFilesToConvert() {

    this.uploader.uploadAll();
    console.log('Enviando arquivos!');
    for (const f of this.files) {
      this.upload(f);
      if (f.type == 'application/pdf') {
        // this.convertFilePDF(f);

      }
      if (f.type == 'application/ps') {
        // this.convertFilePS(f);
      }
    }
  }

  upload(file) {
    const formData = new FormData();
    formData.append('file', file);
    console.log('upload');
    this.ConvertService.upload(formData).subscribe(
      (res) => console.log(res),
      (err) => console.log(err)
    );
  }
  convertFilePS(file) {
    console.log('ConvertFilePS');
    return this.ConvertService.convertFilePS(file).subscribe(
      (data) => {
        console.log(data);
      },
      err => {

      },
      () => {

      }
    );
  }

  downloadFile(link) {
    console.log(link);
    window.location.assign(link);
  }

  getMyConverted(fileName, oName) {
    console.log(fileName);
    const key = JSON.stringify(fileName);
    return this.ConvertService.getMyConverted(key).subscribe(
      (data) => {
        let d: any;
        d = data;
        console.log(data);
        if (d.msg == 'OK') {
          for (const i in this.downloadLinks) {
            if (this.downloadLinks[i].name == oName) {
              this.downloadLinks[i].link = this.donwloadURL + fileName;
            }
          }
         
        }else{
          this.noResponse = true;
        }
      },
      err => {

      },
      () => {

      });
  }
  
  endUpload() {
   
    return this.ConvertService.endUpload().subscribe(
      (data) => {
       
      },
      err => {

      },
      () => {

      });
  }

  convertFilePDF(file) {
    console.log('ConvertFilePDF');
    return this.ConvertService.convertFilePDF(file).subscribe(
      (data) => {

      },
      err => {

      },
      () => {

      }
    );
  }


}
