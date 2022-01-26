/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
import * as electron from 'electron';
import { AfterViewInit, ChangeDetectorRef, Component, Inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { DOCUMENT } from '@angular/common';

import { TranslateService } from '@ngx-translate/core';

const DEFAULT_REGEXPS =  [
  '[a-z]',
  '[a-z]',
  '[a-z]',
  '[a-z]',
  '[a-z]'
];

type LETTER_STATE = '?' | '-' | '+' | '.';

export interface Word {
  word: string;
}

export interface LetterState {
  state:  LETTER_STATE;
}
export interface PossibleLetterState {
  state: LETTER_STATE;
  color: string;
  icon: string;
}

export interface LetterAndLetterState {
  letter: string;
  color: string;
}

const DEFAULT_LETTERS = [
  'a',
  'u',
  'r',
  'e',
  'i'
];

const LETTER_DISABLED = [
  false,
  false,
  false,
  false,
  false
];

const DEFAULT_LETTER_STATES: LetterState[] = [
  { state: '?' },
  { state: '?' },
  { state: '?' },
  { state: '?' },
  { state: '?' }
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('main')
  mainElement;

  public busy = false;

  public letters = [...DEFAULT_LETTERS];
  public letterDisabled = [...LETTER_DISABLED];

  public possibleLetterStates: PossibleLetterState[] = [
    { state: '?', color: 'pi-unknown', icon: 'pi pi-question' },
    { state: '-', color: 'pi-absent', icon: 'pi pi-minus' },
    { state: '+', color: 'pi-present', icon: 'pi pi-plus' },
    { state: '.', color: 'pi-correct', icon: 'pi pi-check' }
  ];

  public letterStates: LetterState[] = [...DEFAULT_LETTER_STATES];

  public letterAndLetterState: LetterAndLetterState[][] = [];

  public regexps = [...DEFAULT_REGEXPS];

  _regexp: string;

  _excludeRegexps: string[] = [
    '[^]',
    '[^]',
    '[^]',
    '[^]',
    '[^]'
  ];

  public _words: Word[] = [];

  constructor(
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document,
    private httpClient: HttpClient,
    private changeDetection: ChangeDetectorRef
  ) {
    this.translate.setDefaultLang('en');
  }

  ngOnInit(): void {
    this.httpClient.get<Word[]>('assets/words/words.json').subscribe(words => {
      this._words = words;
      this.changeDetection.detectChanges();
    });
  }

  ngAfterViewInit(): void {
  }

  get words() {
    const re = this.regexp;
    if (!re) {
      return [];
    }
    return [{ word: 'SOLUTION' }, ...this._words.filter((word) => re.test(word.word))];
  }

  get anagrams() {
    // const anagramLetters = this.letters.join('');
    // const anagramRegexp = new RegExp(`^[${anagramLetters}][${anagramLetters}][${anagramLetters}][${anagramLetters}][${anagramLetters}]`)
    let anagramRegexps = '';

    this.letterDisabled.forEach((ld, index) => {
      if (ld) {
        anagramRegexps += this.letters[index];
      } else {
        anagramRegexps += this._excludeRegexps[index];
      }
    })
    const anagramRegexp = new RegExp(`^${anagramRegexps}$`)
    const re = this.regexp;
    if (!re) {
      return [];
    }
    return [{ word: 'ANAGRAMS' }, ...this._words.filter((word) => anagramRegexp.test(word.word))];
  }

  get notAWord() {
    const wordToCheck = this.letters.join('');
    return !this._words.some((word) => word.word === wordToCheck);
  }

  get regexp() {
    try {
      return new RegExp(`^${this.regexps.join('')}$`, 'i');
    } catch (e) {
    }
    return undefined;
  }

  cannotComputeRegexps() {
    return this.letterStates.some((letterState) => letterState.state === '?');
  }

  computeRegexps() {
    this.letterStates.forEach((letterState, index) => {
      if (letterState.state === '-') {
        this._excludeRegexps.forEach((excludeRegexp, jindex) => {
          this._excludeRegexps[jindex] = this._excludeRegexps[jindex].replace(']', `${this.letters[index]}]`)
        });
      }
      if (letterState.state === '+') {
        this._excludeRegexps[index] = this._excludeRegexps[index].replace(']', `${this.letters[index]}]`);
      }
    });

    this.letterAndLetterState.push(
      this.letters.map((letter, index) => {
        let color;
        switch (this.letterStates[index].state) {
          case '-':
            this.regexps[index] = this._excludeRegexps[index];
            color = 'pi-absent';
            this.letterStates[index] = { state: '?' };
            break;
          case '+':
            this.regexps[index] = this._excludeRegexps[index];
            color = 'pi-present';
            this.letterStates[index] = { state: '?' };
            break;
          case '.':
            this.regexps[index] = this.letters[index];
            this.letterDisabled[index] = true;
            color = 'pi-correct';
            break;
        }
        const letterAndLetterState = {
          letter,
          color
        }
        return letterAndLetterState;
      })
    );
  }

  reset() {
    this._excludeRegexps = [
      '[^]',
      '[^]',
      '[^]',
      '[^]',
      '[^]'
    ];
    this.regexps = [...DEFAULT_REGEXPS];
    this.letterAndLetterState = [];
    this.letterDisabled = [...LETTER_DISABLED];
    this.letterStates = [...DEFAULT_LETTER_STATES];
  }

  public github() {
    electron.shell.openExternal('https://github.com/sandipchitale/wordlassist/');
  }

  public quit() {
    window.close();
  }
}
