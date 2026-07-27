import React from "react";
import styles from "./userProfile.module.css";
import Image from "next/image";

interface ProfileCardProps {
  imageUrl: string;
  name: string;
  profession: string;
  consultationType: string;
  fees: number;
  selectedOffice?: { name: string; address: string } | null;
}

function UserProfile({
  imageUrl,
  name,
  profession,
  consultationType,
  fees,
  selectedOffice,
}: ProfileCardProps) {
  return (
    <div className={styles.profileCard}>
      <div className={styles.profileImage}>
        <Image
          src={imageUrl}
          alt={`${name} profile`}
          width={393}
          height={489}
          className="rounded-lg w-full h-auto lg:w-[476px] lg:h-[354px]"
          priority
        />
      </div>
      <div className={styles.profileDetails}>
        <p className="text-[24px] font-bold">{name}</p>
        <p className="text-center">{profession}</p>
        {consultationType === "Online Consultation" ? (
          <p className={styles.consultationStatus}>
            <span className={styles.statusIcon}></span>
            {consultationType} Selected
          </p>
        ) : (
          selectedOffice && (
            <div className={styles.officeAddress}>
              <p>{selectedOffice.address}</p>
            </div>
          )
        )}
        <div className={styles.consultationFees}>
          <span className={styles.feesIcon}>
            {" "}
            <Image src="/fee.svg" alt="fee" width={24} height={24} priority />
          </span>
          <span>Consultation Fees</span>
          <span className={styles.feesamt}>₹ {fees.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
