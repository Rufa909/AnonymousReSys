import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import solc from 'solc';

const root = fileURLToPath(new URL('../', import.meta.url));
export async function compileContract() {
  const sourceName = 'contracts/DecentralizedEduEvaluation.sol';
  const source = await readFile(resolve(root, sourceName), 'utf8');
  const settings = {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: 'paris',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } },
  };
  const output = JSON.parse(solc.compile(JSON.stringify({
    language: 'Solidity', sources: { [sourceName]: { content: source } }, settings,
  })));
  for (const diagnostic of output.errors || []) {
    if (diagnostic.severity !== 'error') console.warn(diagnostic.formattedMessage);
  }
  const errors = (output.errors || []).filter(diagnostic => diagnostic.severity === 'error');
  if (errors.length) throw new Error(errors.map(error => error.formattedMessage).join('\n'));
  const compiled = output.contracts[sourceName].DecentralizedEduEvaluation;
  return {
    contractName: 'DecentralizedEduEvaluation', sourceName,
    compilerVersion: solc.version(), settings,
    abi: compiled.abi,
    bytecode: `0x${compiled.evm.bytecode.object}`,
    deployedBytecode: `0x${compiled.evm.deployedBytecode.object}`,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const artifact = await compileContract();
  const directory = resolve(root, 'artifacts/contracts');
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, `${artifact.contractName}.json`), `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(`Compiled ${artifact.contractName} with solc ${artifact.compilerVersion}`);
  console.log('ABI and bytecode: artifacts/contracts/DecentralizedEduEvaluation.json');
}
