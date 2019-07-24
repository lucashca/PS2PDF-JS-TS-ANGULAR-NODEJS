import { Injectable} from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { timeout, map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ConvertService {

  headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  });

  options = { headers: this.headers };
  //serverUrl = 'http://localhost:4000/';
  serverUrl = 'http://35.188.196.4:4000/';
  serverUrlUpload = this.serverUrl + 'api/upload';
  serverUrlDownload = this.serverUrl + 'download/';


constructor(private http: HttpClient) { }


convertFilePS(file){
    const URL = this.serverUrl+'convertFilePS/';
    console.log(file);
    return this.http.post(URL,{file:file},);
  }

  endUpload(){
  const URL = this.serverUrl+'endUpload/';
  console.log("endUpload");
  return this.http.get(URL);
}

getMyDownload(fileName){
  const URL = this.serverUrl + 'download/' + fileName;
  console.log("My download"+URL);
  window.open(URL);
}

getDataWorkers(){
  const URL = this.serverUrl + 'getDataWorkers/';
  return this.http.get(URL);
}

getNodesInfo(){
  const URL = this.serverUrl + 'getNodes/';
  return this.http.post(URL,{});
}

getMyConverted(fileName){
    const URL = this.serverUrl+'getMyconvertedFile/';
    return this.http.post(URL,{key:fileName}).pipe(timeout(1000));
  }

convertFilePDF(file){
    const URL = this.serverUrl+'convertFilePDF/';
    console.log(file);
    return this.http.post(URL,{file:file});
  }


  public upload(data) {
    const URL = this.serverUrl+'convertFilePS/';

    return this.http.post<any>(URL, data, {
      reportProgress: true,
      observe: 'events'
    }).pipe(map((event) => {

      switch (event.type) {

        case HttpEventType.UploadProgress:
          const progress = Math.round(100 * event.loaded / event.total);
          return { status: 'progress', message: progress };

        case HttpEventType.Response:
          return event.body;
        default:
          console.log(event);
          return `Unhandled event: ${event.type}`;
      }
    })
    );
  }


}
