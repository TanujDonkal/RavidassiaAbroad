export const MATRIMONY_PLACEHOLDER = "/template/img/no-photo.svg";

export function getMatrimonyActionState(relation) {
  if (!relation) {
    return {
      key: "send_interest",
      label: "Send Interest",
      disabled: false,
    };
  }

  if (relation.can_view_contact) {
    return {
      key: "view_contact",
      label: "View Contact",
      disabled: false,
    };
  }

  if (relation.contact_request_status === "pending") {
    return {
      key: "contact_pending",
      label: "Contact Request Sent",
      disabled: true,
    };
  }

  if (relation.contact_request_status === "declined") {
    return {
      key: "contact_declined",
      label: "Contact Declined",
      disabled: true,
    };
  }

  if (relation.can_request_contact) {
    return {
      key: "request_contact",
      label: "Request Contact",
      disabled: false,
    };
  }

  if (relation.interest_status === "pending") {
    return {
      key: "interest_pending",
      label: "Interest Sent",
      disabled: true,
    };
  }

  if (relation.interest_status === "accepted") {
    return {
      key: "interest_accepted",
      label: "Accepted",
      disabled: true,
    };
  }

  if (relation.interest_status === "rejected") {
    return {
      key: "interest_rejected",
      label: "Interest Rejected",
      disabled: true,
    };
  }

  if (relation.interest_status === "blocked") {
    return {
      key: "interest_blocked",
      label: "Blocked",
      disabled: true,
    };
  }

  return {
    key: "send_interest",
    label: "Send Interest",
    disabled: false,
  };
}

export function getProfilePhotoUrl(profile) {
  return profile?.photo_url || MATRIMONY_PLACEHOLDER;
}

export function getAgeLabel(profile) {
  if (profile?.age) return String(profile.age);
  return "—";
}
