import React from 'react';
import styles from './ComingSoonToast.module.css';

interface ComingSoonToastProps {
  visible: boolean;
}

export default function ComingSoonToast({ visible }: ComingSoonToastProps) {
  return (
    <div className={`${styles.toast} ${visible ? styles.visible : ''}`}>
      Coming soon
    </div>
  );
}
