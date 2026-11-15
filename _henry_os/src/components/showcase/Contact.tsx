import React, { useEffect, useState } from 'react';
import colors from '../../constants/colors';
import twitterIcon from '../../assets/pictures/contact-twitter.png';
import ghIcon from '../../assets/pictures/contact-gh.png';
import inIcon from '../../assets/pictures/contact-in.png';
import ResumeDownload from './ResumeDownload';

export interface ContactProps {}

// function to validate email
const validateEmail = (email: string) => {
    const re =
        // eslint-disable-next-line
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

interface SocialBoxProps {
    icon: string;
    link: string;
}

const SocialBox: React.FC<SocialBoxProps> = ({ link, icon }) => {
    return (
        <a rel="noreferrer" target="_blank" href={link}>
            <div className="big-button-container" style={styles.social}>
                <img src={icon} alt="" style={styles.socialImage} />
            </div>
        </a>
    );
};

const Contact: React.FC<ContactProps> = (props) => {
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [isFormValid, setIsFormValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formMessage, setFormMessage] = useState('');
    const [formMessageColor, setFormMessageColor] = useState('');

    useEffect(() => {
        if (validateEmail(email) && name.length > 0 && message.length > 0) {
            setIsFormValid(true);
        } else {
            setIsFormValid(false);
        }
    }, [email, name, message]);

    async function submitForm() {
        if (!isFormValid) {
            setFormMessage('Form unable to validate, please try again.');
            setFormMessageColor('red');
            return;
        }
        try {
            setIsLoading(true);
            const res = await fetch(
                '/api/contact',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        company,
                        email,
                        name,
                        message,
                    }),
                }
            );
            const data = (await res.json()) as any;
            if (data && data.success) {
                setFormMessage(`Message successfully sent. Thank you ${name}!`);
                setCompany('');
                setEmail('');
                setName('');
                setMessage('');
                setFormMessageColor(colors.blue);
                setIsLoading(false);
            } else {
                setFormMessage(data.error);
                setFormMessageColor(colors.red);
                setIsLoading(false);
            }
        } catch (e) {
            setFormMessage(
                'Thank you for reaching out! You can also email directly: engagevansh@gmail.com'
            );
            setFormMessageColor(colors.blue);
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (formMessage.length > 0) {
            setTimeout(() => {
                setFormMessage('');
                setFormMessageColor('');
            }, 4000);
        }
    }, [formMessage]);

    return (
        <div className="site-page-content">
            <div style={styles.header}>
                <h1>Contact</h1>
                <div style={styles.socials}>
                    <SocialBox
                        icon={ghIcon}
                        link={'https://github.com/Vansh-Sharmaa'}
                    />
                    <SocialBox
                        icon={inIcon}
                        link={'https://linkedin.com/in/vnxsh'}
                    />
                    <SocialBox
                        icon={twitterIcon}
                        link={'https://twitter.com/vanshsharma'}
                    />
                </div>
            </div>
            <div className="text-block">
                <p>
                    I'm actively seeking roles as an <b>AI Engineer / GenAI Engineer</b>. Whether you have questions about my fine-tuning pipelines, agent architectures, or want to discuss collaborating on intelligent systems, my inbox is always open!
                </p>
                <br />
                <p>
                    <b>Email:</b>{' '}
                    <a href="mailto:engagevansh@gmail.com">
                        engagevansh@gmail.com
                    </a>
                </p>
                <p>
                    <b>Phone:</b> +91 9368478556
                </p>
                <p>
                    <b>GitHub:</b>{' '}
                    <a
                        rel="noreferrer"
                        target="_blank"
                        href="https://github.com/Vansh-Sharmaa"
                    >
                        github.com/Vansh-Sharmaa
                    </a>
                </p>
                <p>
                    <b>LinkedIn:</b>{' '}
                    <a
                        rel="noreferrer"
                        target="_blank"
                        href="https://linkedin.com/in/vnxsh"
                    >
                        linkedin.com/in/vnxsh
                    </a>
                </p>
            </div>
            <ResumeDownload />
            <div className="text-block">
                <h3>Send a Message</h3>
                <br />
                <div style={styles.formItem}>
                    <p style={styles.formInfo}>Name:</p>
                    <input
                        style={styles.formItem}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div style={styles.formItem}>
                    <p style={styles.formInfo}>Email:</p>
                    <input
                        style={styles.formItem}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div style={styles.formItem}>
                    <p style={styles.formInfo}>Company (optional):</p>
                    <input
                        style={styles.formItem}
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                    />
                </div>
                <div style={styles.formItem}>
                    <p style={styles.formInfo}>Message:</p>
                    <textarea
                        style={styles.formItem}
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            background: '#c0c0c0',
                            border: '2px outset #ffffff',
                            fontWeight: 'bold',
                        }}
                        onClick={submitForm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send Message'}
                    </button>
                    {formMessage && (
                        <p
                            style={{
                                marginLeft: 16,
                                color: formMessageColor,
                                fontWeight: 'bold',
                            }}
                        >
                            {formMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    header: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    socials: {
        display: 'flex',
        gap: 12,
    },
    social: {
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
    },
    socialImage: {
        width: 28,
        height: 28,
    },
    formItem: {
        width: '100%',
        marginBottom: 12,
    },
    formInfo: {
        marginBottom: 4,
        fontWeight: 'bold',
    },
};

export default Contact;
