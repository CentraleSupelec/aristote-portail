import React, { ChangeEventHandler, useEffect, useRef } from 'react';
import Form from 'react-bootstrap/Form';

interface AutoResizeTextareaProps {
  disabled: boolean,
  defaultValue?: string,
  value?: string,
  onChange?: ChangeEventHandler
}

const AutoResizeTextarea = ({ disabled, defaultValue, value, onChange }: AutoResizeTextareaProps) => {
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
      value={value}
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
