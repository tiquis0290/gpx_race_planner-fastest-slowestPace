import React from 'react';
import { Tooltip } from 'primereact/tooltip';

interface Props {
  id: string;
  text: string;
}

const HelpIcon: React.FC<Props> = ({ id, text }) => (
  <>
    <Tooltip target={`#${id}`} content={text} position="top" className="help-tooltip" />
    <i id={id} className="pi pi-question-circle help-icon" />
  </>
);

export default HelpIcon;
