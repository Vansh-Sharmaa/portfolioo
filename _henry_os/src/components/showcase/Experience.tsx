import React from 'react';
import ResumeDownload from './ResumeDownload';

export interface ExperienceProps {}

const Experience: React.FC<ExperienceProps> = (props) => {
    return (
        <div className="site-page-content">
            <ResumeDownload />

            {/* SECTION 1: OPEN SOURCE & AGENTIC ENGINEERING */}
            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>Open Source AI & GenAI Systems</h1>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href={'https://github.com/Vansh-Sharmaa'}
                        >
                            <h4>github.com/Vansh-Sharmaa</h4>
                        </a>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>AI/ML Engineer & Open Source Builder</h3>
                        <b>
                            <p>2023 - Present</p>
                        </b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Actively architecting, releasing, and evaluating production-grade LLM applications, cyclic multi-agent systems, and parameter-efficient fine-tuning workflows in the open-source ecosystem.
                </p>
                <br />
                <ul>
                    <li>
                        <p>
                            <b>Multi-Agent Orchestration:</b> Designed and deployed cyclic, fault-tolerant agentic architectures using <b>LangGraph and LangChain</b>, featuring specialized roles (Searcher, Scraper, Synthesizer, Critic) with dynamic revision loops.
                        </p>
                    </li>
                    <li>
                        <p>
                            <b>LLM Fine-Tuning & Quantization:</b> Hands-on fine-tuning of open-weights models (Llama 3.2, Llama 3.1) with <b>QLoRA using Unsloth</b>. Quantized checkpoints down to 4-bit GGUF for low-latency local execution on consumer hardware with zero cloud API costs.
                        </p>
                    </li>
                    <li>
                        <p>
                            <b>Production RAG Pipelines:</b> Built and evaluated high-precision vector search platforms utilizing <b>FAISS, Sentence Transformers, and LangChain MapReduce summarization</b> for legal and technical corpora exceeding 10,000+ words.
                        </p>
                    </li>
                    <li>
                        <p>
                            <b>Asynchronous Microservices:</b> Deployed high-throughput FastAPI inference services and interactive Streamlit control dashboards with resilient state persistence and retry logic.
                        </p>
                    </li>
                </ul>
            </div>

            {/* SECTION 2: SPECIALIZED CERTIFICATIONS & FELLOWSHIPS */}
            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>Google AI Agents Intensive</h1>
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href={'https://www.kaggle.com'}
                        >
                            <h4>Kaggle / Google</h4>
                        </a>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>Certified Autonomous Agent Architect</h3>
                        <b>
                            <p>2024</p>
                        </b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Rigorous specialization covering modern agent engineering, multi-turn state preservation, and next-generation agent coordination protocols.
                </p>
                <br />
                <ul>
                    <li>
                        <p>
                            Mastered foundational and emerging <b>agent architectures</b>: ReAct, Plan-and-Solve, and cyclic graph-based agents.
                        </p>
                    </li>
                    <li>
                        <p>
                            Engineered robust <b>agent-to-agent (A2A) communication patterns</b>, tool-calling validation, and structured output enforcement.
                        </p>
                    </li>
                    <li>
                        <p>
                            Evaluated hallucination mitigation techniques via real-time contextual grounding and web retrieval hooks.
                        </p>
                    </li>
                </ul>
            </div>

            {/* SECTION 3: ACADEMIC & HACKATHON ACHIEVEMENTS */}
            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>Competitions & Applied Industry Simulations</h1>
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href={'https://github.com/Vansh-Sharmaa'}
                        >
                            <h4>Portfolio Showcase</h4>
                        </a>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>National Hackathon Participant & Deloitte Simulation</h3>
                        <b>
                            <p>2024 - 2025</p>
                        </b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Applied analytical and machine learning capabilities to real-world corporate data and hackathon problem statements.
                </p>
                <br />
                <ul>
                    <li>
                        <p>
                            <b>National-Level Hackathon:</b> Competed in the AI-Driven Solutions track, engineering rapid proof-of-concept AI pipelines under strict 24-48 hour delivery constraints.
                        </p>
                    </li>
                    <li>
                        <p>
                            <b>Deloitte Australia Data Analytics Simulation (2025):</b> Executed data analysis, forensic telemetry evaluation, and executive presentation of findings.
                        </p>
                    </li>
                    <li>
                        <p>
                            <b>Master of Computer Applications (AI & Data Science):</b> Graphic Era Hill University (2024–2026), CGPA: <b>8.0 / 10</b>.
                        </p>
                    </li>
                    <li>
                        <p>
                            <b>Bachelor of Computer Applications:</b> DIT University (2021–2024), CGPA: <b>7.7 / 10</b>.
                        </p>
                    </li>
                </ul>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    header: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
    },
    headerContainer: {
        alignItems: 'flex-end',
        width: '100%',
        justifyContent: 'space-between',
    },
    headerRow: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    indent: {
        marginLeft: 24,
    },
};

export default Experience;
