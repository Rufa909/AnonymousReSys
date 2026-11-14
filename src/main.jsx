import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ChainWorkspace from './components/ChainWorkspace';
import { useDemoSchoolChain } from './web3/useDemoSchoolChain.js';
import './styles.css';

function Root() {
  const [demo, setDemo] = useState(false);
  return demo ? <div className="demo-mode-container"><div className="demo-mode-strip"><span>CHẾ ĐỘ TRẢI NGHIỆM · Dữ liệu và ví mô phỏng.</span><button onClick={() => setDemo(false)}>Quay lại blockchain thật</button></div><ChainWorkspace key="demo" demo chainHook={useDemoSchoolChain} onDemo={() => setDemo(false)}/></div>
    : <ChainWorkspace key="blockchain" onDemo={() => setDemo(true)}/>;
}
createRoot(document.getElementById('root')).render(<Root/>);
