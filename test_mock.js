const tsNode = require('ts-node');
tsNode.register({ transpileOnly: true });
const { executeMockAction } = require('./src/utils/mockDb.ts');

const latex = `
\\item Nghiệm của phương trình $2x - 4 = 0$ là:
    \\begin{multicols}{4}
        \\begin{enumerate}[label=\\Alph*.]
            \\item $x = 2$.
            \\item $x = -2$.
            \\item $x = 0$.
            \\item $x = 4$.
        \\end{enumerate}
    \\end{multicols}
`;

// Polyfill fetch for node
global.fetch = require('node-fetch');

async function run() {
  try {
    const result = await executeMockAction('parseLatexSection', {
      latex,
      questionType: 'MCQ',
      expectedCount: 1
    });
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error thrown:', err);
  }
}
run();
