import { Component } from '@angular/core';
import { ColorBoxComponent } from './color-box.component';

@Component({
  selector: 'app-root',
  template: `
  <ng-template
   [dynamic-component]="component"
   [inputs]="{backgroundColor: backgroundColor}"
   [outputs]="{backgroundColorChanges: onColorChange.bind(this)}">
  </ng-template>
  <button (click)="changeColor()">Change Color</button>
`,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  component = ColorBoxComponent;
  backgroundColor: ColorBoxComponent['backgroundColor'] = 'green';

  onColorChange(value: ColorBoxComponent['backgroundColor']) {
    console.log(value, this.backgroundColor);
  }

  changeColor() {
    this.backgroundColor = 'blue';
  }
}
