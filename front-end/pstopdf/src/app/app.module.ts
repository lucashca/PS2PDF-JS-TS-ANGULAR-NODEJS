import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DragDropDirective } from './drag-drop.directive';
import { FileSelectDirective, FileDropDirective } from 'ng2-file-upload/ng2-file-upload';

import { ConvertService} from '../app/services/convert.service';

@NgModule({
  declarations: [
    AppComponent,
    DragDropDirective,
    FileSelectDirective,
    FileDropDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [ConvertService],
  bootstrap: [AppComponent]
})
export class AppModule { }
