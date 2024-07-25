import React, { useEffect, useRef } from 'react';
import Form from 'react-bootstrap/Form';

const AutoResizeTextarea = ({ disabled, defaultValue, onChange }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {

      textareaRef.current.style.height = "0px";
      const scrollHeight = textareaRef.current.scrollHeight + 3;
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [defaultValue]);

  return (
    <Form.Control
      as="textarea"
      ref={textareaRef}
      disabled={disabled}
      defaultValue={defaultValue}
      onChange={onChange}
      onInput={() => {
        textareaRef.current.style.height = "0px";
        const scrollHeight = textareaRef.current.scrollHeight + 3;
        textareaRef.current.style.height = scrollHeight + "px";
      }}
    />
  );
};

export default AutoResizeTextarea;
