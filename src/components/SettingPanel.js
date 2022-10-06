import React, { useState } from "react";
import { Button, Modal, message } from "antd";
import SetNotePwModal from "./SetNotePwModal";
import ChangeNotePwModal from "./ChangeNotePwModal";


const SettingPanel = ({ profile, getProfile, isModalOpen = false, closeModal = () => { } }) => {
   const [isSetNotePwModalOpen, setIsSetNotePwModalOpen] = useState(false);
   const [isChangeNotePwModalOpen, setIsChangeNotePwModalOpen] = useState(false);

   return <>
      <Modal
         title={<h1>Profile</h1>}
         open={isModalOpen}
         onCancel={closeModal}
         maskClosable={false}
         footer={null}
      >
         <div>
            <span style={{ marginRight: "10px" }}>username:</span>
            <strong>{profile.username}</strong>
         </div>
         <br></br>
         <br></br>
         <div>
            <span style={{ marginRight: "10px" }}>lock note:</span>
            {
               !profile?.hasNotePassword && <Button
                  type="primary"
                  shape="round"
                  size="small"
                  onClick={() => {
                     setIsSetNotePwModalOpen(true);
                  }}
               >
                  set password...
               </Button>
            }
            {
               profile?.hasNotePassword && <Button
                  type="primary"
                  shape="round"
                  size="small"
                  onClick={() => {
                     setIsChangeNotePwModalOpen(true);
                  }}
               >
                  change password...
               </Button>
            }
         </div>
         <br></br>
         <br></br>
         <br></br>
         <br></br>
         <br></br>
         <br></br>
         <br></br>
         <br></br>
         <br></br>
         <br></br>
         <br></br>
         <br></br>
      </Modal>
      {
         isSetNotePwModalOpen && <SetNotePwModal
            isModalOpen={isSetNotePwModalOpen}
            closeModal={() => {
               setIsSetNotePwModalOpen(false);
            }}
            onSuccess={() => {
               message.success("set note password success");
               setTimeout(() => {
                  setIsSetNotePwModalOpen(false);
                  getProfile();
               }, 600);
            }}
         ></SetNotePwModal>
      }
      {
         isChangeNotePwModalOpen && <ChangeNotePwModal
            isModalOpen={isChangeNotePwModalOpen}
            closeModal={() => {
               setIsChangeNotePwModalOpen(false);
            }}
            onSuccess={() => {
               setTimeout(() => {
                  setIsChangeNotePwModalOpen(false);
                  getProfile();
               }, 600);
            }}
         ></ChangeNotePwModal>
      }
   </>
}

export default SettingPanel;
