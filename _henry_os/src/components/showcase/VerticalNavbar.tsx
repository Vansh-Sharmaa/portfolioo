import React, { useEffect, useState } from 'react';
import { Link } from '../general';
import { useLocation } from 'react-router-dom';

export interface VerticalNavbarProps {}

const VerticalNavbar: React.FC<VerticalNavbarProps> = (props) => {
    const location = useLocation();
    const [projectsExpanded, setProjectsExpanded] = useState(false);
    const [isHome, setIsHome] = useState(false);

    const launch3DPortfolio = () => {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'toggleOS' }, '*');
        } else {
            window.location.href = '/portfolio/index.html';
        }
    };

    useEffect(() => {
        if (location.pathname.includes('/projects')) {
            setProjectsExpanded(true);
        } else {
            setProjectsExpanded(false);
        }
        if (location.pathname === '/') {
            setIsHome(true);
        } else {
            setIsHome(false);
        }
        return () => {};
    }, [location.pathname]);

    return !isHome ? (
        <div style={styles.navbar}>
            <div style={styles.header}>
                <h1 style={styles.headerText}>Vansh</h1>
                <h1 style={styles.headerText}>Sharma</h1>
                <h3 style={styles.headerShowcase}>AI / Software 2026</h3>
            </div>
            <div style={styles.links}>
                <Link containerStyle={styles.link} to="" text="HOME" />
                <Link containerStyle={styles.link} to="about" text="ABOUT" />
                <Link
                    containerStyle={styles.link}
                    to="experience"
                    text="EXPERIENCE & OPEN SOURCE"
                />
                <Link
                    containerStyle={Object.assign(
                        {},
                        styles.link,
                        projectsExpanded && styles.expandedLink
                    )}
                    to="projects"
                    text="PROJECTS"
                />
                {
                    // if current path contains projects
                    projectsExpanded && (
                        <div style={styles.insetLinks}>
                            <Link
                                containerStyle={styles.insetLink}
                                to="projects/software"
                                text="SOFTWARE & AI"
                            />
                        </div>
                    )
                }
                <Link containerStyle={styles.link} to="contact" text="CONTACT" />
            </div>

            <div style={{ marginTop: 24, padding: '0 8px' }}>
                <button
                    onClick={launch3DPortfolio}
                    style={{
                        width: '100%',
                        padding: '8px 4px',
                        background: '#000080',
                        color: '#00ffcc',
                        border: '2px outset #ffffff',
                        fontSize: 11,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: 'MSSerif, monospace',
                        textAlign: 'center',
                    }}
                >
                    ► 3D CRT PORTFOLIO
                </button>
            </div>
            <div style={styles.spacer} />
        </div>
    ) : null;
};

const styles: StyleSheetCSS = {
    navbar: {
        width: 170,
        height: '100%',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid black',
        flexDirection: 'column',
        boxSizing: 'border-box',
        flexShrink: 0,
    },
    header: {
        flexDirection: 'column',
        padding: 16,
        borderBottom: '1px solid black',
    },
    headerText: {
        fontSize: 28,
        lineHeight: 1,
    },
    headerShowcase: {
        marginTop: 8,
        fontSize: 13,
        color: '#666',
    },
    links: {
        flexDirection: 'column',
        padding: '16px 0',
    },
    link: {
        padding: '6px 16px',
    },
    expandedLink: {
        backgroundColor: '#e0e0e0',
    },
    insetLinks: {
        flexDirection: 'column',
        paddingLeft: 16,
        backgroundColor: '#e8e8e8',
    },
    insetLink: {
        padding: '4px 16px',
    },
    spacer: {
        flex: 1,
    },
};

export default VerticalNavbar;
