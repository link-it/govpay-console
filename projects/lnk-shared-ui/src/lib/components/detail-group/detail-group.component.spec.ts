/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { DetailGroupComponent } from './detail-group.component';
import { LNK_IN_DETAIL_GROUP } from './detail-group.token';
import { DetailSectionComponent } from '../detail-section/detail-section.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

@Component({
  standalone: true,
  imports: [DetailGroupComponent, DetailSectionComponent],
  template: `
    <lnk-detail-group [titleKey]="title">
      <lnk-detail-section #child titleKey="Section.A">
        <span>contenuto A</span>
      </lnk-detail-section>
    </lnk-detail-group>
  `,
})
class HostWithGroup {
  title: string | undefined = 'Group.Title';
  @ViewChild('child') child!: DetailSectionComponent;
}

@Component({
  standalone: true,
  imports: [DetailSectionComponent],
  template: `
    <lnk-detail-section #child titleKey="Section.A">
      <span>contenuto A</span>
    </lnk-detail-section>
  `,
})
class HostWithoutGroup {
  @ViewChild('child') child!: DetailSectionComponent;
}

describe('DetailGroupComponent', () => {
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
  });

  it('renderizza con classi card sul host (border + bg + shadow + padding)', () => {
    const fixture = TestBed.createComponent(DetailGroupComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('block');
    expect(host.classList).toContain('rounded-md');
    expect(host.classList).toContain('border');
    expect(host.classList).toContain('p-4');
  });

  it('senza titleKey: nessun header renderizzato', () => {
    const fixture = TestBed.createComponent(DetailGroupComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('header')).toBeNull();
  });

  it('con titleKey: header con titolo tradotto (key raw senza traduzioni)', () => {
    const fixture = TestBed.createComponent(DetailGroupComponent);
    fixture.componentRef.setInput('titleKey', 'Detail.Group.Title');
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('header');
    expect(header).not.toBeNull();
    expect(header.textContent).toContain('Detail.Group.Title');
  });

  it('provider LNK_IN_DETAIL_GROUP=true visibile alle section figlie (variant auto → embedded)', () => {
    const fixture = TestBed.createComponent(HostWithGroup);
    fixture.detectChanges();
    const childSection = fixture.componentInstance.child;
    // effectiveVariant e` `embedded` quando dentro group
    expect(childSection['effectiveVariant']()).toBe('embedded');
    // La section figlia NON deve avere bordo/shadow/bg propri
    const innerSection = fixture.nativeElement.querySelector('lnk-detail-section section') as HTMLElement;
    expect(innerSection.className).not.toContain('border-[var(--card-border)]');
    expect(innerSection.className).not.toContain('bg-[var(--card-bg)]');
  });

  it("section figlia con variant='card' esplicito vince sul contesto del group", () => {
    @Component({
      standalone: true,
      imports: [DetailGroupComponent, DetailSectionComponent],
      template: `
        <lnk-detail-group>
          <lnk-detail-section #child titleKey="A" variant="card" />
        </lnk-detail-group>
      `,
    })
    class HostExplicit {
      @ViewChild('child') child!: DetailSectionComponent;
    }
    const fixture = TestBed.createComponent(HostExplicit);
    fixture.detectChanges();
    expect(fixture.componentInstance.child['effectiveVariant']()).toBe('card');
  });

  it('section fuori da group con variant auto → card (default)', () => {
    const fixture = TestBed.createComponent(HostWithoutGroup);
    fixture.detectChanges();
    expect(fixture.componentInstance.child['effectiveVariant']()).toBe('card');
  });

  it('token LNK_IN_DETAIL_GROUP: optional read = null fuori dal provider', () => {
    const value = TestBed.inject(LNK_IN_DETAIL_GROUP, null as unknown as boolean, { optional: true });
    expect(value).toBeNull();
  });
});
