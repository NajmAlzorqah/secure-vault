export interface PasswordAgeInfo {
  ageInDays: number;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  changedAt: Date | null;
  expirationDays: number;
}

/**
 * Checks if a password has expired based on the expiration policy.
 */
export function isPasswordExpired(
  passwordChangedAt: Date | null,
  expirationDays: number,
): boolean {
  if (expirationDays <= 0) return false;
  if (!passwordChangedAt) return true;

  const expiryDate = new Date(
    passwordChangedAt.getTime() + expirationDays * 24 * 60 * 60 * 1000,
  );

  return new Date() > expiryDate;
}

/**
 * Returns detailed information about password age and expiration status.
 */
export function getPasswordAgeInfo(
  passwordChangedAt: Date | null,
  expirationDays: number,
): PasswordAgeInfo {
  if (!passwordChangedAt) {
    return {
      ageInDays: 0,
      isExpired: expirationDays > 0,
      daysUntilExpiry: expirationDays > 0 ? 0 : null,
      changedAt: null,
      expirationDays,
    };
  }

  const ageInDays = Math.floor(
    (Date.now() - passwordChangedAt.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (expirationDays <= 0) {
    return {
      ageInDays,
      isExpired: false,
      daysUntilExpiry: null,
      changedAt: passwordChangedAt,
      expirationDays,
    };
  }

  const expiryDate = new Date(
    passwordChangedAt.getTime() + expirationDays * 24 * 60 * 60 * 1000,
  );
  const daysUntilExpiry = Math.max(
    0,
    Math.floor((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );
  const isExpired = new Date() > expiryDate;

  return {
    ageInDays,
    isExpired,
    daysUntilExpiry,
    changedAt: passwordChangedAt,
    expirationDays,
  };
}

/**
 * Formats password age as a human-readable string.
 */
export function formatPasswordAge(ageInDays: number): string {
  if (ageInDays === 0) return "Today";
  if (ageInDays === 1) return "1 day ago";
  if (ageInDays < 30) return `${ageInDays} days ago`;
  if (ageInDays < 365) {
    const months = Math.floor(ageInDays / 30);
    const days = ageInDays % 30;
    return days > 0
      ? `${months} month${months !== 1 ? "s" : ""} and ${days} day${days !== 1 ? "s" : ""} ago`
      : `${months} month${months !== 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(ageInDays / 365);
  const remainingDays = ageInDays % 365;
  return remainingDays > 0
    ? `${years} year${years !== 1 ? "s" : ""} and ${remainingDays} day${remainingDays !== 1 ? "s" : ""} ago`
    : `${years} year${years !== 1 ? "s" : ""} ago`;
}
