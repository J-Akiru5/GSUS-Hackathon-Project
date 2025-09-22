import React from 'react';
// Re-export the JSX implementation so TypeScript files can import the component
import DivisionFormModalImpl from './DivisionFormModal.jsx';

const DivisionFormModal: React.ComponentType<any> = DivisionFormModalImpl as any;
export default DivisionFormModal;
