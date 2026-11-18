import React from 'react';
import me from '../../assets/pictures/workingAtComputer.jpg';
import { Link } from 'react-router-dom';
import ResumeDownload from './ResumeDownload';

export interface AboutProps {}

const About: React.FC<AboutProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Welcome</h1>
            <h3>I'm Vansh Sharma</h3>
            <br />
            <div className="text-block">
                <p>
                    I'm an <b>AI/ML Engineer</b> specializing in LLM fine-tuning (QLoRA), Retrieval-Augmented Generation (RAG), and multi-agent orchestration. Hands-on experience building and deploying parameter-efficient fine-tuning workflows, LangChain / LangGraph agent architectures, and production-grade RAG systems end-to-end.
                </p>
                <br />
                <p>
                    I hold a <b>Master of Computer Applications in AI & Data Science</b> from Graphic Era Hill University (CGPA 8.0/10) and a <b>Bachelor of Computer Applications</b> from DIT University (CGPA 7.7/10).
                </p>
                <br />
                <p>
                    Feel free to reach out using <Link to="/contact">this contact form</Link> or shoot me an email at{' '}
                    <a href="mailto:engagevansh@gmail.com">engagevansh@gmail.com</a>.
                </p>
            </div>
            <ResumeDownload />
            <div className="text-block">
                <h3>Technical Skills</h3>
                <br />
                <ul>
                    <li><p><b>Programming Languages:</b> Python, C++, SQL</p></li>
                    <li><p><b>Frameworks & Libraries:</b> LangChain, LangGraph, PyTorch, Hugging Face, Unsloth, Scikit-learn, XGBoost</p></li>
                    <li><p><b>AI & GenAI:</b> RAG, Prompt Engineering, QLoRA Fine-Tuning, Multi-Agent Systems, GGUF Quantization, Ollama</p></li>
                    <li><p><b>Databases & Vector Stores:</b> FAISS, PostgreSQL, MySQL</p></li>
                    <li><p><b>Tools & Platforms:</b> FastAPI, REST APIs, Streamlit, Docker basics, Git, GitHub, Jupyter, Google Colab</p></li>
                    <li><p><b>CS Fundamentals:</b> OOP, DBMS, Operating Systems, Computer Networks</p></li>
                </ul>
                <br />
                <h3>Education</h3>
                <br />
                <ul>
                    <li>
                        <p><b>Graphic Era Hill University</b> — Master of Computer Applications (AI & Data Science), 2024 – 2026</p>
                        <p>CGPA: 8.0 / 10</p>
                    </li>
                    <br />
                    <li>
                        <p><b>DIT University</b> — Bachelor of Computer Applications, 2021 – 2024</p>
                        <p>CGPA: 7.7 / 10</p>
                    </li>
                </ul>
                <br />
                <div className="captioned-image">
                    <img src={me} style={styles.image} alt="" />
                    <p>
                        <sub>
                            <b>Figure 1:</b> Engineering agentic pipelines and fine-tuning models :)
                        </sub>
                    </p>
                </div>
                <br />
                <h3>Certifications & Achievements</h3>
                <br />
                <ul>
                    <li><p><b>Google's 5-Day AI Agents Intensive Course (Kaggle):</b> Comprehensive coverage of autonomous agent architectures, multi-turn agent sessions, and agent-to-agent (A2A) protocol communication.</p></li>
                    <li><p><b>Deloitte Australia:</b> Data Analytics Job Simulation (2025).</p></li>
                    <li><p><b>National-Level Hackathon:</b> Participant, AI-Driven Solutions track.</p></li>
                </ul>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    topImage: {
        width: '100%',
        marginBottom: 32,
    },
    image: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
};

export default About;
