import React from 'react';
import ResumeDownload from '../ResumeDownload';

export interface SoftwareProjectsProps {}

const SoftwareProjects: React.FC<SoftwareProjectsProps> = (props) => {
    const launch3DPortfolio = () => {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'toggleOS' }, '*');
        } else {
            window.location.href = '/portfolio/index.html';
        }
    };

    return (
        <div className="site-page-content">
            <h1>Software & AI Engineering</h1>
            <h3>Selected Machine Learning & Agentic Systems</h3>
            <br />
            <p>
                Below are some of my core machine learning systems, fine-tuned models, autonomous agent frameworks, and open-source platforms built and deployed end-to-end.
            </p>
            <br />
            <ResumeDownload />
            <br />

            <div style={{ marginBottom: 20 }}>
                <button
                    onClick={launch3DPortfolio}
                    style={{
                        padding: '10px 18px',
                        background: '#000080',
                        color: '#00ffcc',
                        border: '2px outset #ffffff',
                        fontSize: 13,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: 'MSSerif, monospace'
                    }}
                >
                    ► LAUNCH IN 3D CRT CYLINDER VIEWER
                </button>
            </div>

            {/* PROJECT 1: FINE-TUNED LLM JOB INFORMATION EXTRACTOR */}
            <div className="text-block">
                <h2>Fine-Tuned LLM Job Information Extractor</h2>
                <br />
                <p>
                    <b>Architecture:</b> Unsloth, QLoRA, PyTorch, Llama 3.2, Ollama, GGUF, FastAPI, json-repair.
                </p>
                <br />
                <p>
                    A specialized parameter-efficient fine-tuning project that transforms raw, unstructured job listings into structured, schema-validated JSON containing skills, candidate requirements, salary brackets, and domain tags.
                </p>
                <br />
                <h3>Key Highlights:</h3>
                <ul>
                    <li><p>Fine-tuned <b>Llama-3.2-3B-Instruct</b> using QLoRA (via Unsloth) on a curated job-postings dataset to extract structured JSON entities from raw text.</p></li>
                    <li><p>Reduced training loss from <b>2.32 to 0.13</b>; quantized the model to <b>4-bit GGUF</b> for high-throughput, low-latency local inference via Ollama.</p></li>
                    <li><p>Implemented a <b>json-repair validation layer</b>, boosting the valid JSON extraction rate to <b>&gt;95%</b> on a 50-sample held-out benchmark.</p></li>
                    <li><p>Deployed an asynchronous FastAPI microservice handling real-time unstructured-to-structured schema extraction.</p></li>
                </ul>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a rel="noreferrer" target="_blank" href="https://github.com/Vansh-Sharmaa">
                            <p><b>[GitHub]</b> - github.com/Vansh-Sharmaa</p>
                        </a>
                    </li>
                </ul>
            </div>

            {/* PROJECT 2: RESEARCHMIND */}
            <div className="text-block">
                <h2>ResearchMind — Multi-Agent Research System</h2>
                <br />
                <p>
                    <b>Architecture:</b> LangGraph, LangChain, Tavily API, Ollama, Llama 3.1, Streamlit.
                </p>
                <br />
                <p>
                    An autonomous, cyclic multi-agent research pipeline designed to execute deep, fact-checked research loops on complex inquiries.
                </p>
                <br />
                <h3>Key Highlights:</h3>
                <ul>
                    <li><p>Built a multi-agent iterative research pipeline in <b>LangGraph orchestrating 4 specialized agents</b> (Search, Scrape, Writer, Critic) with cyclic revision loops.</p></li>
                    <li><p>Integrated <b>Tavily API</b> for real-time web retrieval, feeding structured context into agent prompts to eliminate hallucinations.</p></li>
                    <li><p>Migrated inference from proprietary APIs to a locally hosted <b>Llama 3.1 (8B)</b> model via Ollama, eliminating recurring per-token API costs.</p></li>
                    <li><p>Developed an interactive <b>Streamlit dashboard</b> with state persistence, real-time execution logging, retry logic, and fallback handlers.</p></li>
                </ul>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a rel="noreferrer" target="_blank" href="https://github.com/Vansh-Sharmaa/Multi-agent-research-system">
                            <p><b>[GitHub]</b> - github.com/Vansh-Sharmaa/Multi-agent-research-system</p>
                        </a>
                    </li>
                </ul>
            </div>

            {/* PROJECT 3: LEXAI */}
            <div className="text-block">
                <h2>LexAI — Legal Document Intelligence Platform</h2>
                <br />
                <p>
                    <b>Architecture:</b> LangChain, FAISS, Sentence-Transformers (all-MiniLM-L6-v2), Map-Reduce, Streamlit.
                </p>
                <br />
                <p>
                    End-to-end legal Retrieval-Augmented Generation (RAG) platform delivering clause-level semantic search, risk auditing, and automated legal synthesis.
                </p>
                <br />
                <h3>Key Highlights:</h3>
                <ul>
                    <li><p>Developed an end-to-end legal RAG platform using <b>FAISS and Sentence Transformers (all-MiniLM-L6-v2)</b> for clause-level semantic search and question answering.</p></li>
                    <li><p>Implemented a <b>LangChain MapReduce summarization chain</b> with token-aware chunking to synthesize 10,000+ word legal contracts exceeding typical LLM context windows.</p></li>
                    <li><p>Integrated automated <b>risk-scoring and clause-comparison modules</b>; built a Streamlit UI for natural-language legal auditing.</p></li>
                </ul>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a rel="noreferrer" target="_blank" href="https://github.com/Vansh-Sharmaa/LexAI">
                            <p><b>[GitHub]</b> - github.com/Vansh-Sharmaa/LexAI</p>
                        </a>
                    </li>
                </ul>
            </div>

            {/* PROJECT 4: NETSENTINEL */}
            <div className="text-block">
                <h2>NetSentinel: Autonomous NOC Engine</h2>
                <br />
                <p>
                    <b>Architecture:</b> FastAPI, Python, Docker, Prometheus Telemetry, ITIL Incident Automation.
                </p>
                <br />
                <p>
                    Production-ready Network Operations Center platform engineered with real-time multi-agent telemetry polling, topology-aware alarm correlation, and auto-generated ITIL incident dispatch.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a rel="noreferrer" target="_blank" href="https://github.com/Vansh-Sharmaa/NetSentinel">
                            <p><b>[GitHub]</b> - github.com/Vansh-Sharmaa/NetSentinel</p>
                        </a>
                    </li>
                </ul>
            </div>

            {/* PROJECT 5: QUERYGENIE */}
            <div className="text-block">
                <h2>QueryGenie: Multilingual Text-to-SQL Agent</h2>
                <br />
                <p>
                    <b>Architecture:</b> Groq LLMs, LangGraph, Whisper Voice AI, FastAPI, Self-Healing SQL AST.
                </p>
                <br />
                <p>
                    Multilingual Autonomous Text-to-SQL Agent supporting Hindi, Telugu, Hinglish, and English voice/text input with self-healing syntax correction loops.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a rel="noreferrer" target="_blank" href="https://github.com/Vansh-Sharmaa/QueryGenie">
                            <p><b>[GitHub]</b> - github.com/Vansh-Sharmaa/QueryGenie</p>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default SoftwareProjects;
