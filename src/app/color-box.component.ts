import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-color-box',
  template: `<div style="height: 250px; width: 250px;" [style.background-color]="backgroundColor"></div>`,
})
export class ColorBoxComponent implements OnInit, OnChanges {
  @Input() backgroundColor: 'red' | 'blue' | 'green' = 'red';
  @Output() backgroundColorChanges = new EventEmitter<any>();
  constructor() { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    this.backgroundColorChanges.next(changes.backgroundColor);
  }

}
