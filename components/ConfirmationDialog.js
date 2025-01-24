import React from 'react';
import { Button, AlertDialog } from 'native-base';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, header, body, confirmText = "Delete", cancelText = "Cancel" }) => {
  const cancelRef = React.useRef(null);

  return (
    <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
      <AlertDialog.Content>
        <AlertDialog.CloseButton />
        <AlertDialog.Header>{header}</AlertDialog.Header>
        <AlertDialog.Body>{body}</AlertDialog.Body>
        <AlertDialog.Footer>
          <Button.Group space={2}>
            <Button variant="unstyled" colorScheme="coolGray" onPress={onClose} ref={cancelRef}>
              {cancelText}
            </Button>
            <Button colorScheme="danger" onPress={onConfirm}>
              {confirmText}
            </Button>
          </Button.Group>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
};

export default ConfirmationDialog;
