import React from 'react';
import printer from '../../assets/resume/printer.gif';

export interface ResumeDownloadProps {
    altText?: string;
}

const ResumeDownload: React.FC<ResumeDownloadProps> = ({ altText }) => {
    const handleViewModal = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // If inside 3D room / portfolio parent, open the instant in-app retina viewer
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'openResume' }, '*');
        } else {
            // Standalone: open direct PDF in new tab
            window.open('/resume.pdf', '_blank');
        }
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        // The <a> tag has href="/resume.pdf" download="Vansh_Sharma_Resume.pdf"
        // which triggers direct native browser file save without navigating
    };

    return (
        <div style={styles.resumeContainer}>
            <img style={styles.resumePrinter} alt="" src={printer} />
            <div style={styles.resumeContainerText}>
                <h3>{altText ? altText : 'Looking for my resume?'}</h3>
                <div style={styles.buttonRow}>
                    <button
                        onClick={handleViewModal}
                        style={styles.viewBtn}
                        type="button"
                    >
                        👁 VIEW REAL-TIME RESUME
                    </button>
                    <a
                        href="/resume.pdf"
                        download="Vansh_Sharma_Resume.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleDownload}
                        style={styles.downloadLink}
                    >
                        <button style={styles.downloadBtn} type="button">
                            ↓ DOWNLOAD PDF
                        </button>
                    </a>
                </div>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    resumeContainer: {
        backgroundColor: 'white',
        padding: 12,
        boxSizing: 'border-box',
        border: '2px solid black',
        borderLeftWidth: 0,
        borderRightWidth: 0,
        width: '100%',
        alignItems: 'center',
    },
    resumeContainerText: {
        flexDirection: 'column',
        flex: 1,
    },
    buttonRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 6,
        flexWrap: 'wrap',
    },
    viewBtn: {
        padding: '6px 14px',
        background: '#000080',
        color: '#00ffcc',
        border: '2px outset #ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        cursor: 'pointer',
        fontFamily: 'MSSerif, monospace',
    },
    downloadLink: {
        textDecoration: 'none',
    },
    downloadBtn: {
        padding: '6px 14px',
        background: '#c0c0c0',
        color: '#000000',
        border: '2px outset #ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        cursor: 'pointer',
        fontFamily: 'MSSerif, monospace',
    },
    resumePrinter: {
        width: 56,
        height: 48,
        paddingRight: 24,
    },
};

export default ResumeDownload;
