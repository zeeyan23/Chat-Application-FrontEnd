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
            <Button variant="unstyled" colorScheme="white" onPress={onClose} ref={cancelRef} 
              _pressed={{ bg: '#CC5656' }}
              _hover={{ bg: '#CC5656' }}
              borderRadius="full"
              _text={{ fontWeight: 'bold', color: 'black' }}
              px={6}>
              {cancelText}
            </Button>
            <Button colorScheme="white" onPress={onConfirm} 
              _pressed={{ bg: '#59CC56' }}
              _hover={{ bg: '#59CC56' }}
              borderRadius="full"
              px={6}
              _text={{ fontWeight: 'bold', color: 'black' }}>
              {confirmText}
            </Button>
          </Button.Group>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
};

export default ConfirmationDialog;
