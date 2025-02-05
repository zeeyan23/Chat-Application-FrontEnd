import { Button, Modal } from "native-base";

const MessageDeleteDialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    onExtraAction, 
    header, 
    body, 
    confirmText, 
    cancelText, 
    extraActionText 
  }) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <Modal.Content>
          <Modal.Header>{header}</Modal.Header>
          <Modal.Body>{body}</Modal.Body>
          <Modal.Footer justifyContent={"space-between"}>
            {/* <Button onPress={onClose}>{cancelText}</Button> */}
            <Button colorScheme="red" onPress={onConfirm}>
              {confirmText}
            </Button>
            {onExtraAction && (
              <Button colorScheme="red" variant="outline" onPress={onExtraAction}>
                {extraActionText}
              </Button>
            )}
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    );
  };


  export default MessageDeleteDialog;
  