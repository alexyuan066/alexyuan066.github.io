import { test, expect } from '@playwright/test';
import { parseContactConfig } from '../src/contact-config';

const noContactLinks = {
  email: null,
  emailHref: null,
  phone: null,
  phoneHref: null,
  linkedIn: null,
  resume: null,
};

test('missing or empty public contact settings produce no links', () => {
  for (const input of [undefined, null, {}, { email: ' ', phone: '', linkedIn: '\n', resume: ' ' }]) {
    expect(parseContactConfig(input)).toEqual(noContactLinks);
  }
});

test('valid contact settings trim display text and create usable destinations', () => {
  expect(parseContactConfig({
    email: ' engineer@example.test ',
    phone: ' +1 (202) 555-0123 ',
    linkedIn: ' https://example.test/profile ',
    resume: ' /alex-yuan-resume.pdf ',
  })).toEqual({
    email: 'engineer@example.test',
    emailHref: 'mailto:engineer@example.test',
    phone: '+1 (202) 555-0123',
    phoneHref: 'tel:+12025550123',
    linkedIn: 'https://example.test/profile',
    resume: '/alex-yuan-resume.pdf',
  });
});

test('unsafe URL schemes, malformed values, and credential-bearing URLs produce no links', () => {
  const invalidConfigurations = [
    {
      email: 'engineer@example.test?subject=Injected',
      phone: '++1 (202) 555-0123',
      linkedIn: 'javascript:alert(1)',
      resume: 'javascript:alert(1)',
    },
    {
      email: 17,
      phone: ['+12025550123'],
      linkedIn: { url: 'https://example.test/profile' },
      resume: '//example.test/resume.pdf',
    },
    {
      email: 'mailto:engineer@example.test',
      phone: '123',
      linkedIn: 'http://example.test/profile',
      resume: 'data:application/pdf;base64,invalid',
    },
    {
      email: 'engineer@example.test#injection',
      phone: '1234567890123456',
      linkedIn: 'https://user:password@example.test/profile',
      resume: 'https://user:password@example.test/resume.pdf',
    },
  ];
  for (const input of invalidConfigurations) {
    expect(parseContactConfig(input)).toEqual(noContactLinks);
  }
});
