import { useState, useEffect } from "react";
import type { Expense } from "../../types/types";
import { formatDate, getNameFromId } from "../../utils/formatStrings";
import { useMembers } from "../../hooks/useMembers";
import "../../styling/Modal.css";

interface ViewExpenseModalProps {
  expense: Expense;
  onClose: () => void;
}

const ViewExpenseModal: React.FC<ViewExpenseModalProps> = ({ expense, onClose }) => {
  const [members] = useMembers(expense.groupId);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewingImageSrc, setViewingImageSrc] = useState<string | null>(null);
  const payerName = getNameFromId(members, expense.payerId) ?? "—";
  const images = expense.imageData ?? [];
  const currentSrc = images.length > 0 ? (images[currentSlideIndex].startsWith("data:") ? images[currentSlideIndex] : `data:image/jpeg;base64,${images[currentSlideIndex]}`) : null;

  const goPrev = () => setCurrentSlideIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  const goNext = () => setCurrentSlideIndex((i) => (i >= images.length - 1 ? 0 : i + 1));

  useEffect(() => {
    if (!viewingImageSrc) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingImageSrc(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewingImageSrc]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal view-expense-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{expense.expenseName}</h2>
        {images.length > 0 && (
          <div className="view-expense-slideshow">
            <div className="view-expense-slideshow-main">
              {images.length > 1 && (
                <button
                  type="button"
                  className="view-expense-slideshow-btn view-expense-slideshow-prev"
                  onClick={goPrev}
                  aria-label="Previous image"
                >
                  ‹
                </button>
              )}
              <button
                type="button"
                className="view-expense-image-btn view-expense-slideshow-img-wrap"
                onClick={() => currentSrc && setViewingImageSrc(currentSrc)}
              >
                <img
                  src={currentSrc ?? undefined}
                  alt={`Attachment ${currentSlideIndex + 1}`}
                  className="view-expense-slideshow-img"
                />
              </button>
              {images.length > 1 && (
                <button
                  type="button"
                  className="view-expense-slideshow-btn view-expense-slideshow-next"
                  onClick={goNext}
                  aria-label="Next image"
                >
                  ›
                </button>
              )}
            </div>
            <div className="view-expense-slideshow-indicator">
              {currentSlideIndex + 1} of {images.length}
            </div>
          </div>
        )}
        <dl className="view-expense-details">
          {/* <div className="view-expense-row">
            <dt>Description</dt>
            <dd>{expense.expenseName}</dd>
          </div> */}
          <div className="view-expense-row">
            <dt>Amount</dt>
            <dd>${expense.amount.toFixed(2)}</dd>
          </div>
          <div className="view-expense-row">
            <dt>Date</dt>
            <dd>{formatDate(expense.date)}</dd>
          </div>
          <div className="view-expense-row">
            <dt>Paid by</dt>
            <dd>{payerName}</dd>
          </div>
          <div className="view-expense-row">
            <dt>Split between</dt>
            <dd>
              {expense.splits.length > 0
                ? expense.splits
                  .map((s) => `${s.memberName ?? "—"}: $${s.amount.toFixed(2)}`)
                  .join(", ")
                : "—"}
            </dd>
          </div>
        </dl>



        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel-btn">
            Close
          </button>
        </div>
      </div>

      {viewingImageSrc && (
        <div
          className="view-expense-lightbox"
          onClick={(e) => {
            e.stopPropagation();
            setViewingImageSrc(null);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setViewingImageSrc(null)}
          aria-label="Close image view"
        >
          <img
            src={viewingImageSrc}
            alt="Expense attachment"
            className="view-expense-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ViewExpenseModal;
