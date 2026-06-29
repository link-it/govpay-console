/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { SearchInputComponent } from './search-input.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(SearchInputComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('SearchInputComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          fallbackLang: 'it',
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('input vuoto: nessun pulsante clear', () => {
    const fixture = render({ value: '' });
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('value valorizzato: appare il pulsante clear', () => {
    const fixture = render({ value: 'foo' });
    expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
  });

  it('digitando emette valueChange dopo il debounce', () => {
    const fixture = render({ value: '', debounce: 300 });
    const handler = vi.fn();
    fixture.componentInstance.valueChange.subscribe(handler);

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'abc';
    input.dispatchEvent(new Event('input'));

    expect(handler).not.toHaveBeenCalled();
    vi.advanceTimersByTime(299);
    expect(handler).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledWith('abc');
  });

  it('keystroke ravvicinati: solo l\'ultimo valore viene emesso (debounce reset)', () => {
    const fixture = render({ debounce: 200 });
    const handler = vi.fn();
    fixture.componentInstance.valueChange.subscribe(handler);

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    for (const v of ['a', 'ab', 'abc']) {
      input.value = v;
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100); // < debounce → reset
    }
    vi.advanceTimersByTime(200); // → emit finale

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('abc');
  });

  it('clear() svuota il buffer ed emette valueChange immediato', () => {
    const fixture = render({ value: 'hello' });
    fixture.detectChanges();
    const handler = vi.fn();
    fixture.componentInstance.valueChange.subscribe(handler);

    fixture.componentInstance.clear();
    fixture.detectChanges();

    expect(handler).toHaveBeenCalledWith('');
    expect(fixture.componentInstance.local()).toBe('');
  });
});
