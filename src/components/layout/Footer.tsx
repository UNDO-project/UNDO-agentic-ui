import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: "divider",
        py: 3,
        mt: "auto",
        bgcolor: "background.paper",
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="body2"
          align="center"
          sx={{ color: "text.secondary" }}
        >
          Developed by the{" "}
          <Link
            href="https://undo-project.info"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            underline="hover"
          >
            UNDO project
          </Link>{" "}
          dev team. Code hosted on{" "}
          <Link
            href="https://github.com/undo-project"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            underline="hover"
          >
            GitHub
          </Link>
          .
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;
