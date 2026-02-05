import "../../styling/Modal.css";

interface ConfirmDeleteModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
}) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
      <h2>{title}</h2>
      <p className="confirm-message">{message}</p>
      <div className="modal-actions">
        <button type="button" onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className="delete-confirm-btn">
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDeleteModal;
