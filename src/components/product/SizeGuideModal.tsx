import { Modal } from '@/components/ui/Modal';
import { ringSizes } from '@/data/sizes';

/** Israeli ring-size chart + how to measure at home. */
export function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="מדריך מידות">
      <div className="space-y-8 text-sm leading-relaxed text-stone">
        <section>
          <h3 className="text-base text-charcoal">איך למדוד בבית</h3>
          <ol className="mt-3 list-decimal space-y-2 ps-5">
            <li>גזרי רצועת נייר ברוחב כחצי סנטימטר.</li>
            <li>עטפי אותה סביב בסיס האצבע, צמוד, אבל כך שתעבור מעל הפרק.</li>
            <li>סמני בעט את נקודת המפגש ומדדי את האורך בסרגל, במילימטרים.</li>
            <li>המספר שקיבלת הוא ההיקף. אתרי אותו בטבלה כדי לקבל את המידה.</li>
          </ol>
          <p className="mt-3">
            כדאי למדוד בסוף היום, כשהאצבעות בנפח מלא, ולחזור על המדידה פעמיים.
            אם יצאתן בין שתי מידות, עדיף לעגל למידה הגדולה.
          </p>
        </section>

        <section>
          <h3 className="text-base text-charcoal">טבלת מידות</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[280px] border-collapse text-start">
              <caption className="sr-only">
                טבלת המרה בין מידת טבעת ישראלית להיקף פנימי במילימטרים
              </caption>
              <thead>
                <tr className="border-b border-mist">
                  <th scope="col" className="py-2 text-start font-normal text-charcoal">
                    מידה
                  </th>
                  <th scope="col" className="py-2 text-start font-normal text-charcoal">
                    היקף פנימי
                  </th>
                </tr>
              </thead>
              <tbody>
                {ringSizes.map((row) => (
                  <tr key={row.size} className="border-b border-mist/60">
                    <td className="py-2">{row.size}</td>
                    <td className="py-2">{row.circumference} מ״מ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            המידה בישראל היא הקוטר הפנימי במילימטרים. אם עדיין יש התלבטות, אפשר
            לכתוב לנו ונעזור, ובכל מקרה ההחלפה אפשרית תוך 30 יום.
          </p>
        </section>
      </div>
    </Modal>
  );
}
