import React from 'react';
import { Link } from '../general';
import { useNavigate } from 'react-router-dom';

export interface HomeProps {}

const Home: React.FC<HomeProps> = (props) => {
    const navigate = useNavigate();

    const goToContact = () => {
        navigate('/contact');
    };

    const launch3DPortfolio = () => {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'toggleOS' }, '*');
        } else {
            window.location.href = '/portfolio/index.html';
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.name}>Vansh Sharma</h1>
                <h2>AI/ML Engineer & Creative Technologist</h2>
                <p style={{ marginTop: 8, fontSize: 16, color: '#333' }}>
                    LLM Fine-Tuning (QLoRA) • LangChain / LangGraph Multi-Agent Orchestration • Production RAG
                </p>
            </div>
            <div style={styles.buttons}>
                <Link containerStyle={styles.link} to="about" text="ABOUT" />
                <Link
                    containerStyle={styles.link}
                    to="experience"
                    text="EXPERIENCE & OPEN SOURCE"
                />
                <Link
                    containerStyle={styles.link}
                    to="projects"
                    text="PROJECTS"
                />
                <Link
                    containerStyle={styles.link}
                    to="contact"
                    text="CONTACT"
                />
            </div>

            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                    onClick={launch3DPortfolio}
                    style={{
                        padding: '12px 24px',
                        background: '#000080',
                        color: '#00ffcc',
                        border: '3px outset #ffffff',
                        fontSize: 15,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: 'MSSerif, monospace',
                        boxShadow: '2px 2px 0px #000'
                    }}
                >
                    ► ENTER 3D CRT CYLINDER PORTFOLIO
                </button>
            </div>

            <div style={styles.forHireContainer} onMouseDown={goToContact}>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    page: {
        left: 0,
        right: 0,
        top: 0,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '100%',
    },
    header: {
        textAlign: 'center',
        marginBottom: 48,
        marginTop: 48,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttons: {
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    image: {
        width: 800,
    },
    link: {
        padding: 12,
    },
    nowHiring: {
        backgroundColor: 'red',
        padding: 16,
    },
    forHireContainer: {
        marginTop: 32,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
    },
    name: {
        fontSize: 64,
        marginBottom: 12,
        lineHeight: 0.95,
    },
};

export default Home;
