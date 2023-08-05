import {
  ComponentMirror,
  ComponentRef,
  Directive,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChange,
  SimpleChanges,
  Type,
  ViewContainerRef,
  reflectComponentType,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type UserOutputs = Record<string, (event: any) => void>;
type UserInputs = Record<string, any>;
type ComponentInputs = ComponentMirror<any>['inputs'];
type ComponentOutputs = ComponentMirror<any>['outputs'];
@Directive({
  selector: '[dynamic-component-v14]',
})
export class DynamicComponentV14Directive implements OnDestroy, OnChanges {
  private subscription = new Subject<null>();
  private componentMirror?: ComponentMirror<any> | null;
  private componentRef?: ComponentRef<any>;
  @Input('dynamic-component') component!: Type<any>;
  @Input() outputs?: UserOutputs = {};
  @Input() inputs?: UserInputs = {};
  @Input() injector?: Injector;

  constructor(private viewContainerRef: ViewContainerRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    assertNotNullOrUndefined(this.component);

    let componentChanges: Record<string, SimpleChange>;
    const shouldCreateNewComponent =
      changes.component?.previousValue !== changes.component?.currentValue ||
      changes.injector?.previousValue !== changes.injector?.currentValue;

    if (shouldCreateNewComponent) {
      this.destroyComponent();
      this.createComponent();
      componentChanges = this.makeComponentChanges(changes.inputs, true);
    }
    componentChanges ??= this.makeComponentChanges(changes.inputs, false);

    assertNotNullOrUndefined(this.componentMirror);
    assertNotNullOrUndefined(this.componentRef);

    this.validateOutputs(
      this.componentMirror.outputs,
      this.outputs ?? {},
      this.componentRef.instance
    );
    this.validateInputs(this.componentMirror.inputs, this.inputs ?? {});
    if (changes.inputs) {
      this.bindInputs(
        this.componentMirror.inputs,
        this.inputs ?? {},
        this.componentRef.instance
      );
    }
    if (changes.outputs) {
      this.subscription.next(null); // to remove old subscription
      this.bindOutputs(
        this.componentMirror.outputs,
        this.outputs ?? {},
        this.componentRef.instance
      );
    }
    if ((this.componentRef.instance as OnChanges).ngOnChanges) {
      this.componentRef.instance.ngOnChanges(componentChanges);
    }
  }

  ngOnDestroy(): void {
    this.destroyComponent();
    this.subscription.next(null);
    this.subscription.complete();
  }

  private makeComponentChanges(
    inputsChange: SimpleChange,
    firstChange: boolean
  ): Record<string, SimpleChange> {
    const previuosInputs = inputsChange?.previousValue ?? {};
    const currentInputs = inputsChange?.currentValue ?? {};
    return Object.keys(currentInputs).reduce((acc, inputName) => {
      const currentInputValue = currentInputs[inputName];
      const previuosInputValue = previuosInputs[inputName];
      if (currentInputValue !== previuosInputValue) {
        acc[inputName] = new SimpleChange(
          firstChange ? undefined : previuosInputValue,
          currentInputValue,
          firstChange
        );
      }
      return acc;
    }, {} as Record<string, SimpleChange>);
  }

  private createComponent() {
    this.componentRef = this.viewContainerRef.createComponent(this.component, {
      injector: this.injector,
    });
    this.componentMirror = reflectComponentType(this.component);
  }

  private bindOutputs(
    componentOutputs: ComponentInputs,
    userOutputs: UserInputs,
    componentInstance: any
  ) {
    componentOutputs.forEach((output) => {
      (componentInstance[output.propName] as EventEmitter<any>)
        .pipe(takeUntil(this.subscription))
        .subscribe((event) => {
          const handler = userOutputs[output.templateName];
          if (handler) {
            // in case the output has not been provided at all
            handler(event);
          }
        });
    });
  }

  private bindInputs(
    componentInputs: ComponentInputs,
    userInputs: UserInputs,
    componentInstance: any
  ) {
    componentInputs.forEach((input) => {
      const inputValue = userInputs[input.templateName];
      componentInstance[input.propName] = inputValue;
    });
  }

  private validateOutputs(
    componentOutputs: ComponentOutputs,
    userOutputs: UserOutputs,
    componentInstance: any
  ) {
    componentOutputs.forEach((output) => {
      if (!(componentInstance[output.propName] instanceof EventEmitter)) {
        throw new Error(
          `Output ${output.propName} must be a typeof EventEmitter`
        );
      }
    });

    const outputsKeys = Object.keys(userOutputs);
    outputsKeys.forEach((key) => {
      const componentHaveThatOutput = componentOutputs.some(
        (output) => output.templateName === key
      );
      if (!componentHaveThatOutput) {
        throw new Error(`Output ${key} is not ${this.component.name} output.`);
      }
      if (!(userOutputs[key] instanceof Function)) {
        throw new Error(`Output ${key} must be a function`);
      }
    });
  }

  private validateInputs(
    componentInputs: ComponentInputs,
    userInputs: UserInputs
  ) {
    const userInputsKeys = Object.keys(userInputs);
    userInputsKeys.forEach((userInputKey) => {
      const componentHaveThatInput = componentInputs.some(
        (componentInput) => componentInput.templateName === userInputKey
      );
      if (!componentHaveThatInput) {
        throw new Error(
          `Input ${userInputKey} is not ${this.component.name} input.`
        );
      }
    });
  }

  private destroyComponent() {
    this.componentRef?.destroy();
    this.viewContainerRef.clear();
  }
}

function assertNotNullOrUndefined<T>(
  value: T
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`cannot be undefined or null`);
  }
}
