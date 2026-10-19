import assert from 'node:assert/strict'
import test from 'node:test'
import * as TokenizeYaml from '../src/tokenizeYaml.js'

const tokenize = (lines) => {
  let state = TokenizeYaml.initialLineState
  return lines.map((line) => {
    const result = TokenizeYaml.tokenizeLine(line, state)
    state = result
    return result
  })
}

test('embeds Bash run blocks and resumes YAML after dedent', () => {
  const lines = [
    'jobs:',
    '  release:',
    '    steps:',
    '      - name: release',
    '        shell: bash',
    '        run: |',
    '          echo "RG_VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV',
    '          echo "version is: ${{ env.RG_VERSION }}"',
    '',
    '      - name: next step',
    '        run: echo done',
  ]

  const results = tokenize(lines)

  assert.equal(results[5].embeddedLanguage, 'shellscript')
  assert.equal(results[5].embeddedLanguageStart, lines[5].length)
  assert.equal(results[6].embeddedLanguage, 'shellscript')
  assert.equal(results[6].embeddedLanguageStart, 10)
  assert.equal(results[6].embeddedLanguageEnd, lines[6].length)
  assert.equal(results[7].embeddedLanguage, 'shellscript')
  assert.equal(results[8].embeddedLanguage, 'shellscript')
  assert.equal(results[9].embeddedLanguage, '')
  assert.equal(results[10].embeddedLanguage, '')
})

test('embeds a default-shell run block without an explicit shell setting', () => {
  const lines = [
    'jobs:',
    '  publish-release:',
    '    steps:',
    '      - name: Publish GitHub release',
    '        env:',
    '          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}',
    '        run: |',
    '          VERSION="${{ needs.create-release.outputs.rg_version }}"',
    '          gh release edit $VERSION --draft=false',
  ]

  const results = tokenize(lines)

  assert.equal(results[6].embeddedLanguage, 'shellscript')
  assert.equal(results[7].embeddedLanguage, 'shellscript')
  assert.equal(results[8].embeddedLanguage, 'shellscript')
})

test('does not embed unrelated YAML literal scalars', () => {
  const lines = ['description: |', '  this is ordinary YAML text', 'steps:']

  const results = tokenize(lines)

  assert.ok(results.every((result) => result.embeddedLanguage === ''))
})

test('resets embedded Bash state between adjacent steps', () => {
  const results = tokenize([
    'steps:',
    '  - shell: bash',
    '    run: |',
    '      echo first',
    '  - shell: bash',
    '    run: |',
    '      echo second',
    '    name: following YAML property',
  ])

  assert.equal(results[3].embeddedLanguage, 'shellscript')
  assert.equal(results[6].embeddedLanguage, 'shellscript')
  assert.equal(results[7].embeddedLanguage, '')
})
