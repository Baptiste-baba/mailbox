mod menu;

fn main() {
    tauri::Builder::default()
        .menu(menu::french_menu)
        .run(tauri::generate_context!())
        .expect("MailBox could not start");
}
