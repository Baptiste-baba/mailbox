/**
 * Holds back the navigations that would take the test page to another site, such as the sign-in
 * page of a mail provider, and tells where they were going. Moving inside the app goes on as usual.
 */
export function holdDepartures(): { destinations: string[]; release: () => void } {
  const destinations: string[] = [];
  const hold = (event: NavigateEvent) => {
    if (new URL(event.destination.url).origin !== window.location.origin) {
      event.preventDefault();
      destinations.push(event.destination.url);
    }
  };
  navigation.addEventListener('navigate', hold);
  return { destinations, release: () => navigation.removeEventListener('navigate', hold) };
}
