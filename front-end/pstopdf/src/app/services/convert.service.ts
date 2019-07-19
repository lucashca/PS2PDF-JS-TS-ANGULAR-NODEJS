import { Injectable} from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { timeout, map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ConvertService {

  headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  options = { headers: this.headers };
 

  serverUrl = "http://localhost:3000/";

  constructor(private http: HttpClient) { }


  convertFilePS(file){
    const URL = this.serverUrl+'convertFilePS/';
    console.log(file);
    return this.http.post(URL,{file:file},);
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
