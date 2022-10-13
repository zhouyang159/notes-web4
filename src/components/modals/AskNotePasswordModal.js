import React, { useState, useImperativeHandle, forwardRef, useRef } from "react";
import { Modal, Form, Input } from "antd";


const AskNotePasswordModal = (props, ref) => {
   useImperativeHandle(ref, () => ({
      open: (callback) => {
         setIsModalOpen(true);
         setOk(() => {
            return callback;
         });

         setTimeout(() => {
            inputRef.current.focus();
         }, 100);
      },
      close: () => {
         setIsModalOpen(false);
      }
   }));

   const inputRef = useRef();
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [password, setPassword] = useState("");
   const [ok, setOk] = useState(() => {
      return () => { }
   });


   const submit = () => {
      ok(password);
      setPassword("");
   }

   return <Modal
      title={<></>}
      open={isModalOpen}
      maskClosable={false}
      onOk={submit}
      onCancel={() => {
         setIsModalOpen(false);
      }}
      closable={false}
      destroyOnClose
   >
      <Form
         name="basic"
      >
         <Form.Item
            label="Note Password"
         >
            <Input.Password ref={inputRef} value={password} onChange={(e) => setPassword(e.target.value)} onPressEnter={submit} />
         </Form.Item>
      </Form>
   </Modal>
}

export default forwardRef(AskNotePasswordModal);
