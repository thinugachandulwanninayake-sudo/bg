import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  FileCheck2,
  ScanLine,
} from 'lucide-react';

/**
 * The ORYQEN product screen shown inside the floating phones. Every string here is
 * carried over verbatim from the original site.
 */
export default function AppScreen({ small = false }: { small?: boolean }) {
  return (
    <div className={'phone ' + (small ? 'phone-small' : '')}>
      <div className="phone-edge">
        <div className="phone-island" />
        <div className="phone-content">
          <div className="phone-top">
            <span className="tiny-brand">◈ ORYQEN</span>
            <span className="avatar">A</span>
          </div>
          <div className="phone-greeting">
            GOOD MORNING <span>✳</span>
          </div>
          <h3>
            Move forward
            <br />
            <em>with clarity.</em>
          </h3>
          <div className="phone-hero-card">
            <div className="phc-label">
              <ScanLine size={13} /> YOUR OPPORTUNITY
            </div>
            <div className="phc-title">Review a new offer</div>
            <div className="phc-sub">Know what matters, before you say yes.</div>
            <div className="phc-arrow">
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className="phone-section-title">
            Your workspace <span>VIEW ALL →</span>
          </div>
          <div className="phone-tiles">
            <div>
              <div className="tile-icon">
                <FileCheck2 size={17} />
              </div>
              <b>Agreements</b>
              <small>Review terms</small>
            </div>
            <div>
              <div className="tile-icon purple">
                <BriefcaseBusiness size={17} />
              </div>
              <b>Work Passport</b>
              <small>Track your journey</small>
            </div>
          </div>
          <div className="phone-activity">
            <span className="activity-dot" />
            <span>READY WHEN YOU ARE</span>
            <Check size={13} />
          </div>
          <div className="phone-nav">
            <span>⌂</span>
            <span>▦</span>
            <span>◈</span>
            <span>◯</span>
          </div>
        </div>
      </div>
      <span className="phone-glare" aria-hidden="true" />
    </div>
  );
}
