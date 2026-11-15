import React from 'react';
import ResumeDownload from '../ResumeDownload';

export interface SoftwareProjectsProps {}

const SoftwareProjects: React.FC<SoftwareProjectsProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Software</h1>
            <h3>Selected Engineering Projects</h3>
            <br />
            <p>
                Below are some of my favorite software platforms and intelligent systems I have built and deployed.
            </p>
            <br />
            <ResumeDownload />
            <br />

            {/* PROJECT 1: NETSENTINEL */}
            <div className="text-block">
                <h2>NetSentinel: Autonomous NOC Engine</h2>
                <br />
                <p>
                    <b>Architecture:</b> FastAPI, Python, Docker, Prometheus Telemetry, ITIL Incident Pipelines.
                </p>
                <br />
                <p>
                    Production-ready Network Operations Center platform engineered with real-time multi-agent telemetry polling, topology-aware alarm correlation, and auto-generated ITIL P1/P2 incident dispatch. Built to handle heavy packet streams with sub-second alerting.
                </p>
                <br />
                <h3>Key Highlights:</h3>
                <ul>
                    <li><p>Automated root-cause analysis reduces mean time to resolution (MTTR) by 65%.</p></li>
                    <li><p>Distributed Docker container deployment with auto-recovering health checks.</p></li>
                    <li><p>Full-fidelity live topology graph visualization.</p></li>
                </ul>
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

            {/* PROJECT 2: FILEGENIE */}
            <div className="text-block">
                <h2>FileGenie: Intelligent ML File Organizer</h2>
                <br />
                <p>
                    <b>Architecture:</b> 300-Tree RandomForest ML, FastAPI, React 18, Scikit-Learn, JWT Auth.
                </p>
                <br />
                <p>
                    Content-based automated file intelligence platform. Uses a 300-tree RandomForest classifier to parse, categorize, and organize unstructured files, documents, and codebases with 98.4% categorization accuracy.
                </p>
                <br />
                <h3>Links:</h3>
                <ul>
                    <li>
                        <a rel="noreferrer" target="_blank" href="https://github.com/Vansh-Sharmaa/FileGenie">
                            <p><b>[GitHub]</b> - github.com/Vansh-Sharmaa/FileGenie</p>
                        </a>
                    </li>
                </ul>
            </div>

            {/* PROJECT 3: QUERYGENIE */}
            <div className="text-block">
                <h2>QueryGenie: Multilingual Text-to-SQL Agent</h2>
                <br />
                <p>
                    <b>Architecture:</b> Groq LLMs, LangGraph, Whisper Voice AI, FastAPI, Self-Healing SQL AST.
                </p>
                <br />
                <p>
                    Multilingual Autonomous Text-to-SQL Agent supporting Hindi, Telugu, Hinglish, and English voice/text input. Leverages LangGraph self-healing loops that auto-correct syntax and schema mismatch in under 0.15s.
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

            {/* PROJECT 4: LEXAI */}
            <div className="text-block">
                <h2>LexAI: Legal Document Intelligence</h2>
                <br />
                <p>
                    <b>Architecture:</b> Legal NLP, Clause Audit, GitHub CI/CD, CodeQL Automated Security.
                </p>
                <br />
                <p>
                    AI-Driven legal intelligence suite providing contract analysis, clause extraction, compliance auditing, and risk scoring for fast-moving legal and procurement teams.
                </p>
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

            {/* PROJECT 5: INTELLECTA */}
            <div className="text-block">
                <h2>Intellecta: Multi-Agent Research Engine</h2>
                <br />
                <p>
                    <b>Architecture:</b> Autonomous Multi-Agent Orchestration, LangChain, Vector Storage.
                </p>
                <br />
                <p>
                    Coordinates specialized AI researcher agents to gather, verify, synthesize, and compile deep multi-angle research on any complex scientific or engineering subject.
                </p>
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
        </div>
    );
};

export default SoftwareProjects;
