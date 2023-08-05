import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ColorBoxComponent } from './color-box.component';
import { DynamicComponentDirective } from './dynamic-component.directive';
import { DynamicComponentV14Directive } from './dynamic-component.directive.v13';

@NgModule({
  declarations: [
    AppComponent,
    ColorBoxComponent,
    DynamicComponentDirective,
    DynamicComponentV14Directive,
  ],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
