export class Wort {
  constructor(text) {
    this.text = text;
    this.anzRichtig = 0;
    this.anzFalsch = 0;
    this.falscheVarianten = {};
  }

  richtigGeschrieben() {
    this.anzRichtig++;
  }

  falschGeschrieben(variante) {
    this.anzFalsch++;
    if (!variante) return;
    this.falscheVarianten[variante] = (this.falscheVarianten[variante] || 0) + 1;
  }

  static fromJSON(obj) {
    const w = new Wort(obj.text);
    w.anzRichtig = obj.anzRichtig;
    w.anzFalsch = obj.anzFalsch;
    w.falscheVarianten = obj.falscheVarianten || {};
    return w;
  }
}
