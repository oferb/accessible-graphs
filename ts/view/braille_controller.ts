let previousFocus = null;
let brailleController = null;
let keyboardRoutingKeysMode = 0;
// A flag for debugging
// Reset it to true to have the BrailleController listen for all events of the textarea which contains the braille text
let listenForAllEvents = false;

class BrailleController {
  // These symbols map 1:1 to numbers.
  static BRAILLE_SYMBOLS = '⠀⣀⠤⠒⠉';

  static routingModeToMessages = {
    0: 'You can use simulated routing keys to route cursor from position 1 to 10',
    1: 'You can use simulated routing keys to route cursor from position 11 to 20',
    2: 'You can use simulated routing keys to route cursor from position 21 to 29'
  }

  textarea: HTMLTextAreaElement;
  selectionListener: (this: void, e: Event) => void;
  currentPosition: number;
  data: number[];

  constructor(parent, data) {
    if (document.getElementById('brailleControllerText')) {
      throw new Error('Braille controller already created');
    }
    const textarea: HTMLTextAreaElement = document.createElement('textarea');
    textarea.id = 'brailleControllerText';
    // In Chrome, readonly textarea doesn't support moving the cursor via the keyboard, or even cursor blinking
    // therefore, we can't use the readonly property, rather, we have to prevent the user from entering characters to the textarea. See:
    //https://stackoverflow.com/questions/19005579/how-to-enable-cursor-move-while-using-readonly-attribute-in-input-field-in-chrom
    textarea.setAttribute('maxlength', '0');
    textarea.addEventListener('keydown', this.onKeyDown);
    textarea.addEventListener('oncut', this.ignoreEvent);
    textarea.addEventListener('mousedown', this.onSecondRoutingKeyPress);
    if (listenForAllEvents == true) {
      BrailleController.bindAllEvents(textarea, BrailleController.logEvent);
    }
    // Limit the textarea to one line using css techniques
    textarea.style.whiteSpace = 'nowrap';
    textarea.style.overflowX = 'auto';
    textarea.addEventListener('focus', this.onFocus);
    textarea.addEventListener('blur', this.onBlur);

    const brailleControllerInstructions: HTMLElement = document.createElement('p');
    brailleControllerInstructions.innerHTML = 'Use Left / Right arrows to navigate the graph.<br> Use space bar to get more info about the value under the cursor.<br>To start, focus or click on the text box below:';
    parent.appendChild(brailleControllerInstructions);
    let brailleControllerLabel: HTMLElement = document.createElement('label');
    brailleControllerLabel.innerHTML = 'Start navigating the graph';
    brailleControllerLabel.setAttribute('for', 'brailleControllerText');
    parent.appendChild(brailleControllerLabel);
    parent.appendChild(textarea);

    this.textarea = textarea;

    // Note: We initially tried document.addEventListener('selectionchange', func)
    //       but that didn't work in Firefox.
    setInterval(this.checkSelection, 50);
    this.currentPosition = -1;
    this.data = data;
    this.initializeBraille();
    setInterval(this.updateFocus, 50);
  }

  /**
   * @param {HTMLTextAreaElement} element
   * @param {callback} callback
   */
  static bindAllEvents(element: HTMLTextAreaElement, callback) {
    for (let key in element) {
      if (/^on/.test(key)) {
        element.addEventListener(key.slice(2), callback);
      }
    }
  }

  static normalizeData(data: number[], range: number): number[] {
    const result: number[] = Array();
    for (let i = 0; i < data.length; i++) {
      result[i] = BrailleController.normalizeDataElement(data[i], range);
    }
    return result;
  }

  static normalizeDataElement(dataElement: number, range: number): number {
    const min: number = parseFloat(getUrlParam('minValue'));
    const max: number = parseFloat(getUrlParam('maxValue'));
    if (dataElement < min) {
      dataElement = min;
    }
    if (dataElement > max) {
      dataElement = max;
    }
    if (min == max) {
      return 0;
    }
    let normalizedDataElement: number = (dataElement - min) / (max - min) * (range - 0.01);
    return normalizedDataElement;
  }

  static logEvent(event) {
    console.debug(event.type);
  }

  initializeBraille() {
    let leftSideData: number[] = BrailleController.normalizeData(this.data, 4);
    let allBrailleForeLeftSide: string = BrailleController.getAllBrailleForLeftSide(leftSideData);
    let initialBraile: string = '';
    let dataLength: number = allBrailleForeLeftSide.length;
    let iteration: number = 1;
    let i: number = 0;
    while (i < dataLength) {
      while (i < 29 * iteration && i < dataLength) {
        initialBraile += allBrailleForeLeftSide[i];
        i++;
      }
      for (let j = 0; j < 29 * iteration - i; j++) {
        initialBraile += '⠀';
      }
      initialBraile += '⡇';
      for (let j = 0; j < 10; j++) {
        initialBraile += '⠀';
      }
      iteration++;
    }
    this.setBraille(initialBraile);
    this.updateRightSideBraille(0);
  }

  static getAllBrailleForLeftSide(data: number[]): string {
    let brailleData: string = '';
    for (let i = 0; i < data.length; i++) {
      const d: number = data[i];
      const b: number = BrailleController.getBrailleValue(d);
      brailleData += BrailleController.BRAILLE_SYMBOLS.charAt(b);
    }
    return brailleData;
  }

  static getBrailleForRightSide(dataElement: number): string {
    let result: string = '';
    let onCharscount: number = Math.round(dataElement);
    let i: number = 0;
    while (i < onCharscount) {
      result += '⠒';
      i++;
    }
    while (i < 10) {
      result += '⠀';
      i++;
    }
    return result;
  }

  updateRightSideBraille(position: number) {
    let positionInData: number = position - (position / 40 | 0) * 11;
    let rightSideDataElement: number = BrailleController.normalizeDataElement(this.data[positionInData], 10);
    let rightSideBraille: string = BrailleController.getBrailleForRightSide(rightSideDataElement);
    let positionToInsertBraille: number = (position / 40 | 0) * 40 + 30;
    let brailleText: string = this.getBraille();
    brailleText = BrailleController.splice(brailleText, rightSideBraille, positionToInsertBraille);
    this.setBraille(brailleText);
    this.setCursorPosition(position);
  }

  static getBrailleValue(value: number): number {
    return value + 1 | 0;
  }

  checkSelection() {
    let cursorPosition = brailleController.textarea.selectionStart;
    if (brailleController.currentPosition !== cursorPosition && cursorPosition < data.length) {
      brailleController.currentPosition = cursorPosition;
      brailleController.onSelection();
    } else if (brailleController.currentPosition !== cursorPosition) {
      if (!inReadAllMode) {
        brailleController.setCursorPosition(brailleController.currentPosition);
      } else{
        brailleController.currentPosition = cursorPosition;
        brailleController.onSelection();
      }
    }
  }

  updateFocus() {
    if (previousFocus === document.activeElement) {
      return;
    }
    previousFocus = document.activeElement;
  }

  ignoreEvent(event: Event) {
    event.preventDefault();
  }

  onKeyDown(event) {
    resetReadEntireGraph();
    inReadAllMode = false;
    if (event.key.includes('ArrowDown') || event.key.includes('ArrowUp') || event.key.includes('Backspace') || event.key.includes('Delete')) {
      event.preventDefault();
    }
    if (event.key === 'ArrowRight' && brailleController.currentPosition === data.length - 1) {
      event.preventDefault();
    }
    if (event.key == ' ') {
      const position = brailleController.currentPosition;
      if (position % 40 >= 0 && position % 40 < 29 && position < brailleController.data.length) {
        reportText(true); // On space key press
      }
      event.preventDefault();
    }
    if (brailleController.isNumberKey(event.key)) {
      brailleController.simulateRoutingKey(event.key);
    }
    if (event.key === '-') {
      keyboardRoutingKeysMode = ((keyboardRoutingKeysMode + 3) - 1) % 3;
      speakText(BrailleController.routingModeToMessages[keyboardRoutingKeysMode]);
    }
    if (event.key === '=') {
      keyboardRoutingKeysMode = (keyboardRoutingKeysMode + 1) % 3;
      speakText(BrailleController.routingModeToMessages[keyboardRoutingKeysMode]);
    }
  }

  isNumberKey(key) {
    if (key === '1' || key === '2' || key === '3'
      || key === '4' || key === '5' || key === '6'
      || key === '7' || key === '8' || key === '9' || key === '0') {
      return true;
    } else {
      return false;
    }
  }

  simulateRoutingKey(key) {
    let keyNumber = parseInt(key);
    let position = 0;
    if (keyNumber >= 1 && keyNumber <= 9) {
      position = (keyNumber - 1) + 10 * keyboardRoutingKeysMode;
    } else if (keyNumber === 0 && keyboardRoutingKeysMode === 0) {
      position = 9;
    } else if (keyNumber === 0 && keyboardRoutingKeysMode === 1) {
      position = 19;
    } else {
      return;
    }
    let currentPosition = brailleController.textarea.selectionEnd;
    if (currentPosition !== position) {
      brailleController.setCursorPosition(position);
    } else {
      brailleController.onSecondRoutingKeyPress();
    }
  }

  onSecondRoutingKeyPress(event) {
    const position: number = brailleController.currentPosition;
    if (position % 40 >= 0 && position % 40 < 29 && position < brailleController.data.length) {
      reportText(true);
    }
  }

  setBraille(text: string) {
    this.textarea.value = text;
  }

  getBraille(): string {
    return this.textarea.value;
  }

  setSelectionListener(listener) {
    this.selectionListener = listener;
  }

  setCursorPosition(position: number) {
    // The cursor will leave it's original position when setting a new braille text to the textarea
    // so return it to the previous position in which it was before setting the braille text
    this.textarea.selectionEnd = position;
    this.textarea.selectionStart = position;
  }

  onSelection() {
    if (brailleController.selectionListener == null) {
      return;
    }
    const cursorPosition = brailleController.currentPosition;
    const currrentChar = brailleController.textarea.value.slice(cursorPosition, cursorPosition + 1);
    const newEvent = {
      position: cursorPosition,
      character: currrentChar,
      text: brailleController.textarea.value
    };

    brailleController.selectionListener(newEvent);
  }

  static splice(string: string, substring: string, position: number): string {
    return string.slice(0, position) + substring + string.slice(position + substring.length);
  }

  onFocus(event) {
    if (inReadAllMode) {
      return;
    }
    document.getElementById('liveRegion').setAttribute('style', '');
    // @ts-ignore
    if (!window.chrome) {
      brailleController.onSelection();
    } else if (previousFocus.id !== 'brailleControllerText') {
      brailleController.onSelection();
    }
  }

  onBlur(event) {
    document.getElementById('liveRegion').setAttribute('style', 'display: none;');
  }

}
