use base64::{engine::general_purpose, Engine as _};
use printpdf::{BuiltinFont, Color, Mm, PdfDocument, Rgb};
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::BufWriter;
use std::path::PathBuf;
use std::process::Command;

#[derive(Deserialize)]
struct ReportFilePayload {
    filename: String,
    title: String,
    content: String,
}

#[derive(Serialize)]
struct SavedReportPayload {
    filename: String,
    title: String,
    path: String,
}

#[tauri::command]
fn save_monthly_reports(
    target_folder: String,
    month_key: String,
    reports: Vec<ReportFilePayload>,
) -> Result<String, String> {
    if target_folder.trim().is_empty() {
        return Err("Nincs megadva report célmappa.".to_string());
    }

    if reports.is_empty() {
        return Err("Nincs mentendő report.".to_string());
    }

    let report_dir = PathBuf::from(&target_folder).join(format!("{}_havi_report", month_key));

    fs::create_dir_all(&report_dir)
        .map_err(|e| format!("Nem sikerült létrehozni a report mappát: {}", e))?;

    for report in reports {
        let file_path = report_dir.join(&report.filename);
        create_styled_pdf(&file_path, &report.title, &report.content)?;
    }

    Ok(report_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn save_pdf_reports(
    target_folder: String,
    folder_name: String,
    reports: Vec<ReportFilePayload>,
) -> Result<Vec<SavedReportPayload>, String> {
    if target_folder.trim().is_empty() {
        return Err("Nincs megadva PDF célmappa.".to_string());
    }

    if reports.is_empty() {
        return Err("Nincs mentendő PDF.".to_string());
    }

    let safe_folder_name = sanitize_path_part(&folder_name);
    let report_dir = PathBuf::from(&target_folder).join(safe_folder_name);

    fs::create_dir_all(&report_dir)
        .map_err(|e| format!("Nem sikerült létrehozni a PDF mappát: {}", e))?;

    let mut saved = Vec::new();

    for report in reports {
        let safe_filename = sanitize_pdf_filename(&report.filename);
        let file_path = report_dir.join(&safe_filename);
        create_styled_pdf(&file_path, &report.title, &report.content)?;

        saved.push(SavedReportPayload {
            filename: safe_filename,
            title: report.title,
            path: file_path.to_string_lossy().to_string(),
        });
    }

    Ok(saved)
}

#[tauri::command]
fn read_pdf_base64(path: String) -> Result<String, String> {
    let path = validate_pdf_path(&path)?;
    let bytes = fs::read(&path).map_err(|e| {
        format!(
            "Nem sikerült beolvasni a PDF fájlt ({}): {}",
            path.display(),
            e
        )
    })?;

    Ok(general_purpose::STANDARD.encode(bytes))
}

#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    let path = validate_existing_path(&path)?;
    open_path_with_system(&path)
}

#[tauri::command]
fn open_parent_folder(path: String) -> Result<(), String> {
    let path = validate_existing_path(&path)?;
    let parent = path
        .parent()
        .ok_or_else(|| "Nem található szülőmappa ehhez a fájlhoz.".to_string())?;
    open_path_with_system(parent)
}

#[tauri::command]
fn print_pdf(path: String) -> Result<(), String> {
    let path = validate_pdf_path(&path)?;

    #[cfg(target_os = "windows")]
    {
        Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Start-Process -FilePath $args[0] -Verb Print",
                &path.to_string_lossy(),
            ])
            .spawn()
            .map_err(|e| format!("Nem sikerült elindítani a nyomtatást: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("lpr")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Nem sikerült elindítani a nyomtatást: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("lpr")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Nem sikerült elindítani a nyomtatást: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
fn compose_email_with_pdf(path: String, subject: String, body: String) -> Result<String, String> {
    let path = validate_pdf_path(&path)?;

    #[cfg(target_os = "windows")]
    {
        let script = r#"
$path = $args[0]
$subject = $args[1]
$body = $args[2]
try {
  $outlook = New-Object -ComObject Outlook.Application
  $mail = $outlook.CreateItem(0)
  $mail.Subject = $subject
  $mail.Body = $body
  [void]$mail.Attachments.Add($path)
  $mail.Display()
  exit 0
} catch {
  exit 2
}
"#;

        let status = Command::new("powershell")
            .args([
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                script,
                &path.to_string_lossy(),
                &subject,
                &body,
            ])
            .status()
            .map_err(|e| format!("Nem sikerült elindítani az e-mail előkészítést: {}", e))?;

        if status.success() {
            return Ok("Outlook e-mail ablak megnyitva PDF csatolmánnyal.".to_string());
        }
    }

    #[cfg(target_os = "macos")]
    {
        let script = r#"
on run argv
  set pdfPath to item 1 of argv
  set mailSubject to item 2 of argv
  set mailBody to item 3 of argv
  tell application "Mail"
    set newMessage to make new outgoing message with properties {subject:mailSubject, content:mailBody & return & return, visible:true}
    tell newMessage
      make new attachment with properties {file name:POSIX file pdfPath} at after the last paragraph
    end tell
    activate
  end tell
end run
"#;

        let status = Command::new("osascript")
            .args(["-e", script, &path.to_string_lossy(), &subject, &body])
            .status()
            .map_err(|e| format!("Nem sikerült elindítani az e-mail előkészítést: {}", e))?;

        if status.success() {
            return Ok("Mail e-mail ablak megnyitva PDF csatolmánnyal.".to_string());
        }
    }

    #[cfg(target_os = "linux")]
    {
        let status = Command::new("xdg-email")
            .args([
                "--subject",
                &subject,
                "--body",
                &body,
                "--attach",
                &path.to_string_lossy(),
            ])
            .status()
            .map_err(|e| format!("Nem sikerült elindítani az e-mail előkészítést: {}", e))?;

        if status.success() {
            return Ok("E-mail ablak megnyitva PDF csatolmánnyal.".to_string());
        }
    }

    open_path_with_system(
        path.parent()
            .ok_or_else(|| "Nem található a PDF mappája.".to_string())?,
    )?;

    Ok("Nem találtam csatolmányt kezelő levelezőt, ezért megnyitottam a PDF mappáját.".to_string())
}

fn sanitize_path_part(value: &str) -> String {
    let cleaned: String = value
        .chars()
        .map(|ch| match ch {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            _ => ch,
        })
        .collect();

    let trimmed = cleaned.trim();
    if trimmed.is_empty() {
        "pdf_reportok".to_string()
    } else {
        trimmed.to_string()
    }
}

fn sanitize_pdf_filename(value: &str) -> String {
    let mut filename = sanitize_path_part(value);
    if !filename.to_lowercase().ends_with(".pdf") {
        filename.push_str(".pdf");
    }
    filename
}

fn validate_existing_path(path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(path);
    if !path.exists() {
        return Err(format!(
            "A fájl vagy mappa nem található: {}",
            path.display()
        ));
    }
    Ok(path)
}

fn validate_pdf_path(path: &str) -> Result<PathBuf, String> {
    let path = validate_existing_path(path)?;
    let is_pdf = path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("pdf"))
        .unwrap_or(false);

    if !path.is_file() || !is_pdf {
        return Err(format!("Nem PDF fájl: {}", path.display()));
    }

    Ok(path)
}

fn open_path_with_system(path: &std::path::Path) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Nem sikerült megnyitni: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Nem sikerült megnyitni: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Nem sikerült megnyitni: {}", e))?;
    }

    Ok(())
}

fn wrap_text(line: &str, max_chars: usize) -> Vec<String> {
    if line.chars().count() <= max_chars {
        return vec![line.to_string()];
    }

    let mut result: Vec<String> = Vec::new();
    let mut current = String::new();

    for word in line.split_whitespace() {
        let candidate = if current.is_empty() {
            word.to_string()
        } else {
            format!("{} {}", current, word)
        };

        if candidate.chars().count() > max_chars {
            if !current.is_empty() {
                result.push(current.clone());
                current.clear();
            }

            if word.chars().count() > max_chars {
                let mut chunk = String::new();

                for ch in word.chars() {
                    chunk.push(ch);
                    if chunk.chars().count() >= max_chars {
                        result.push(chunk.clone());
                        chunk.clear();
                    }
                }

                if !chunk.is_empty() {
                    current = chunk;
                }
            } else {
                current = word.to_string();
            }
        } else {
            current = candidate;
        }
    }

    if !current.is_empty() {
        result.push(current);
    }

    if result.is_empty() {
        result.push(String::new());
    }

    result
}

fn trim_leading_report_headers(content: &str) -> Vec<String> {
    let mut lines: Vec<String> = content.lines().map(|s| s.trim_end().to_string()).collect();

    while !lines.is_empty() {
        let first = lines[0].trim();
        if first.is_empty()
            || first == "TÁRSASHÁZ ÓVODA UTCA 6/A"
            || first == "HAVI HÁZPÉNZTÁR REPORT"
            || first == "LAKÁSONKÉNTI HAVI REPORT"
        {
            lines.remove(0);
        } else {
            break;
        }
    }

    lines
}

fn is_section_header(line: &str) -> bool {
    matches!(
        line.trim(),
        "LAKÁSONKÉNTI ÖSSZESÍTÉS" | "HAVI PÉNZTÁRNAPLÓ" | "HAVI BEFIZETÉSI TÉTELEK"
    )
}

fn is_meta_line(line: &str) -> bool {
    let trimmed = line.trim();
    trimmed.starts_with("Hónap:")
        || trimmed.starts_with("Generálva:")
        || trimmed.starts_with("Lakás:")
        || trimmed.starts_with("Lakás azonosító:")
}

fn is_summary_line(line: &str) -> bool {
    let trimmed = line.trim();
    trimmed.starts_with("Nyitó egyenleg")
        || trimmed.starts_with("Havi befizetések összesen:")
        || trimmed.starts_with("Havi kiadások összesen:")
        || trimmed.starts_with("Záró egyenleg")
        || trimmed.starts_with("Havi közös költség:")
        || trimmed.starts_with("Ebben a hónapban befizetve:")
        || trimmed.starts_with("Havi egyenleg:")
}

fn is_table_like_line(line: &str) -> bool {
    line.contains('|')
}

fn use_colored_text(
    layer: &printpdf::PdfLayerReference,
    text: &str,
    size: f32,
    x: f32,
    y: f32,
    font: &printpdf::IndirectFontRef,
    r: f32,
    g: f32,
    b: f32,
) {
    layer.set_fill_color(Color::Rgb(Rgb::new(r, g, b, None)));
    layer.use_text(text, size, Mm(x), Mm(y), font);
}

fn create_styled_pdf(path: &PathBuf, title: &str, content: &str) -> Result<(), String> {
    let (doc, first_page, first_layer) = PdfDocument::new(title, Mm(210.0), Mm(297.0), "Layer 1");

    let regular_font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| format!("Nem sikerült normál betűtípust létrehozni: {:?}", e))?;

    let bold_font = doc
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|e| format!("Nem sikerült félkövér betűtípust létrehozni: {:?}", e))?;

    let mono_font = doc.add_builtin_font(BuiltinFont::Courier).map_err(|e| {
        format!(
            "Nem sikerült rögzített szélességű betűtípust létrehozni: {:?}",
            e
        )
    })?;

    let left_margin: f32 = 16.0;
    let page_width: f32 = 210.0;
    let page_height: f32 = 297.0;
    let top_start: f32 = 280.0;
    let bottom_margin: f32 = 16.0;
    let line_step: f32 = 6.0;

    let mut current_page = first_page;
    let mut current_layer = doc.get_page(current_page).get_layer(first_layer);
    let mut y: f32 = top_start;
    let mut page_number = 1;

    let header_title = "TÁRSASHÁZ ÓVODA UTCA 6/A";
    use_colored_text(
        &current_layer,
        header_title,
        19.0,
        left_margin,
        y,
        &bold_font,
        0.12,
        0.22,
        0.35,
    );
    y -= 9.0;

    use_colored_text(
        &current_layer,
        title,
        13.0,
        left_margin,
        y,
        &bold_font,
        0.18,
        0.45,
        0.55,
    );
    y -= 6.0;

    use_colored_text(
        &current_layer,
        "Barátságosan hivatalos havi kimutatás",
        9.0,
        left_margin,
        y,
        &regular_font,
        0.45,
        0.50,
        0.56,
    );
    y -= 10.0;

    use_colored_text(
        &current_layer,
        "--------------------------------------------------------------------------",
        10.0,
        left_margin,
        y,
        &mono_font,
        0.75,
        0.80,
        0.84,
    );
    y -= 9.0;

    let lines = trim_leading_report_headers(content);

    for raw_line in lines {
        let trimmed = raw_line.trim().to_string();

        let (font, size, r, g, b, max_chars, extra_gap_before, extra_gap_after) =
            if trimmed.is_empty() {
                (
                    &regular_font,
                    10.0_f32,
                    0.18_f32,
                    0.18_f32,
                    0.18_f32,
                    92usize,
                    0.0_f32,
                    1.5_f32,
                )
            } else if is_section_header(&trimmed) {
                (
                    &bold_font, 12.5_f32, 0.16_f32, 0.42_f32, 0.52_f32, 80usize, 4.0_f32, 2.0_f32,
                )
            } else if is_meta_line(&trimmed) {
                (
                    &bold_font, 10.5_f32, 0.25_f32, 0.29_f32, 0.34_f32, 90usize, 0.0_f32, 0.5_f32,
                )
            } else if is_summary_line(&trimmed) {
                (
                    &bold_font, 10.5_f32, 0.10_f32, 0.38_f32, 0.30_f32, 90usize, 0.5_f32, 0.5_f32,
                )
            } else if is_table_like_line(&trimmed) {
                (
                    &mono_font, 9.5_f32, 0.17_f32, 0.17_f32, 0.17_f32, 96usize, 0.0_f32, 0.0_f32,
                )
            } else {
                (
                    &regular_font,
                    10.5_f32,
                    0.18_f32,
                    0.18_f32,
                    0.18_f32,
                    92usize,
                    0.0_f32,
                    0.0_f32,
                )
            };

        if extra_gap_before > 0.0 {
            y -= extra_gap_before;
        }

        let wrapped = if trimmed.is_empty() {
            vec![String::new()]
        } else {
            wrap_text(&trimmed, max_chars)
        };

        for line in wrapped {
            if y <= bottom_margin {
                let (next_page, next_layer) =
                    doc.add_page(Mm(page_width), Mm(page_height), "Next Layer");
                current_page = next_page;
                current_layer = doc.get_page(current_page).get_layer(next_layer);
                page_number += 1;
                y = top_start;

                use_colored_text(
                    &current_layer,
                    header_title,
                    15.0,
                    left_margin,
                    y,
                    &bold_font,
                    0.12,
                    0.22,
                    0.35,
                );
                y -= 8.0;

                use_colored_text(
                    &current_layer,
                    title,
                    10.0,
                    left_margin,
                    y,
                    &bold_font,
                    0.18,
                    0.45,
                    0.55,
                );
                y -= 10.0;
            }

            if !line.is_empty() {
                use_colored_text(&current_layer, &line, size, left_margin, y, font, r, g, b);
            }

            y -= line_step;
        }

        if extra_gap_after > 0.0 {
            y -= extra_gap_after;
        }
    }

    let footer_y: f32 = 10.0;
    use_colored_text(
        &current_layer,
        &format!("Oldal {}", page_number),
        8.0,
        left_margin,
        footer_y,
        &regular_font,
        0.50,
        0.54,
        0.58,
    );
    use_colored_text(
        &current_layer,
        "Created by Deme Gábor © 2026",
        8.0,
        132.0,
        footer_y,
        &regular_font,
        0.50,
        0.54,
        0.58,
    );

    let file = File::create(path).map_err(|e| {
        format!(
            "Nem sikerült létrehozni a PDF fájlt ({}): {}",
            path.display(),
            e
        )
    })?;

    doc.save(&mut BufWriter::new(file)).map_err(|e| {
        format!(
            "Nem sikerült elmenteni a PDF fájlt ({}): {}",
            path.display(),
            e
        )
    })?;

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_monthly_reports,
            save_pdf_reports,
            read_pdf_base64,
            open_file,
            open_parent_folder,
            print_pdf,
            compose_email_with_pdf
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
