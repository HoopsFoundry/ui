import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';
import { Button } from './Button';
import { expectNoA11yViolations } from './test-utils';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const clickBackdrop = () => {
  const backdrop = document.querySelector('.hoops-backdrop')!;
  fireEvent.pointerDown(backdrop, { button: 0, pointerType: 'mouse' });
  fireEvent.pointerUp(backdrop, { button: 0, pointerType: 'mouse' });
  fireEvent.click(backdrop);
};

describe('Modal', () => {
  it('rendert nichts, wenn es geschlossen ist', () => {
    render(<Modal open={false} onOpenChange={() => {}} title="Titel">Inhalt</Modal>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('rendert einen Dialog, benannt nach dem Titel, mit Untertitel, Inhalt und Footer', () => {
    render(
      <Modal open onOpenChange={() => {}} title="Spielbericht freigeben" subtitle="17. Spieltag" footer={<Button>OK</Button>}>
        Inhalt
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Spielbericht freigeben' })).toBeInTheDocument();
    expect(screen.getByText('17. Spieltag')).toHaveClass('hoops-m-subtitle');
    expect(screen.getByText('Inhalt')).toBeInTheDocument();
    expect(document.querySelector('.hoops-m-footer')).toContainElement(screen.getByRole('button', { name: 'OK' }));
  });

  it('setzt Größen-Modifier außer für md', () => {
    const { rerender } = render(<Modal open onOpenChange={() => {}} title="T" size="wide">x</Modal>);
    expect(screen.getByRole('dialog')).toHaveClass('hoops-modal', 'hoops-modal--wide');
    rerender(<Modal open onOpenChange={() => {}} title="T" size="md">x</Modal>);
    expect(screen.getByRole('dialog')).not.toHaveClass('hoops-modal--md');
  });

  it('zeigt bei severity ein Header-Icon, bei default keins', () => {
    const { rerender } = render(<Modal open onOpenChange={() => {}} title="T" severity="danger">x</Modal>);
    expect(document.querySelector('.hoops-m-head-icon--danger svg')).toBeInTheDocument();
    rerender(<Modal open onOpenChange={() => {}} title="T">x</Modal>);
    expect(document.querySelector('.hoops-m-head-icon')).toBeNull();
  });

  it('schließt über den Schließen-Button', () => {
    const onOpenChange = vi.fn();
    render(<Modal open onOpenChange={onOpenChange} title="T">x</Modal>);
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('erlaubt ein eigenes closeLabel', () => {
    render(<Modal open onOpenChange={() => {}} title="T" closeLabel="Close">x</Modal>);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('schließt mit Escape', () => {
    const onOpenChange = vi.fn();
    render(<Modal open onOpenChange={onOpenChange} title="T">x</Modal>);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('schließt standardmäßig nicht bei Klick auf den Hintergrund', async () => {
    const onOpenChange = vi.fn();
    render(<Modal open onOpenChange={onOpenChange} title="T">x</Modal>);
    await tick();
    clickBackdrop();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('schließt mit dismissOnBackdrop bei Klick auf den Hintergrund', async () => {
    const onOpenChange = vi.fn();
    render(<Modal open onOpenChange={onOpenChange} title="T" dismissOnBackdrop>x</Modal>);
    await tick();
    clickBackdrop();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('schließt per Button, auch ohne Hintergrund-Klick', async () => {
    const onOpenChange = vi.fn();
    render(<Modal open onOpenChange={onOpenChange} title="T">x</Modal>);
    await tick();
    clickBackdrop();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closable={false}: kein Schließen-Button, Escape und Hintergrund schließen nicht', async () => {
    const onOpenChange = vi.fn();
    render(<Modal open onOpenChange={onOpenChange} title="T" closable={false}>x</Modal>);
    await tick();
    expect(screen.queryByRole('button', { name: 'Schließen' })).toBeNull();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    clickBackdrop();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('hat keine axe-Verstöße', async () => {
    render(<Modal open onOpenChange={() => {}} title="Turnier löschen?" severity="danger" footer={<Button>OK</Button>}>Inhalt</Modal>);
    await expectNoA11yViolations(document.body);
  });
});
