import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, LogLevel } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clearLogs();
    vi.clearAllMocks();
  });

  it('logs debug messages', () => {
    const consoleSpy = vi.spyOn(console, 'debug');

    logger.debug('Test debug message', { key: 'value' });

    expect(consoleSpy).toHaveBeenCalled();
    expect(logger.getLogs()).toHaveLength(1);
    expect(logger.getLogs()[0].level).toBe(LogLevel.DEBUG);
    expect(logger.getLogs()[0].message).toBe('Test debug message');
  });

  it('logs info messages', () => {
    const consoleSpy = vi.spyOn(console, 'info');

    logger.info('Test info message');

    expect(consoleSpy).toHaveBeenCalled();
    expect(logger.getLogs()).toHaveLength(1);
    expect(logger.getLogs()[0].level).toBe(LogLevel.INFO);
  });

  it('logs warnings', () => {
    const consoleSpy = vi.spyOn(console, 'warn');

    logger.warn('Test warning', { reason: 'test' });

    expect(consoleSpy).toHaveBeenCalled();
    expect(logger.getLogs()).toHaveLength(1);
    expect(logger.getLogs()[0].level).toBe(LogLevel.WARN);
  });

  it('logs errors with stack traces', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    const testError = new Error('Test error');

    logger.error('Something went wrong', testError, { context: 'test' });

    expect(consoleSpy).toHaveBeenCalled();
    expect(logger.getLogs()).toHaveLength(1);
    expect(logger.getLogs()[0].level).toBe(LogLevel.ERROR);
    expect(logger.getLogs()[0].stack).toBeDefined();
  });

  it('filters logs by level', () => {
    logger.debug('Debug');
    logger.info('Info');
    logger.warn('Warn');
    logger.error('Error', new Error('test'));

    expect(logger.getLogs()).toHaveLength(4);
    expect(logger.getLogs(LogLevel.ERROR)).toHaveLength(1);
    expect(logger.getLogs(LogLevel.INFO)).toHaveLength(1);
  });

  it('clears logs', () => {
    logger.info('Test 1');
    logger.info('Test 2');

    expect(logger.getLogs()).toHaveLength(2);

    logger.clearLogs();

    expect(logger.getLogs()).toHaveLength(0);
  });

  it('exports logs as JSON', () => {
    logger.info('Test message');

    const exported = logger.exportLogs();
    const parsed = JSON.parse(exported);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].message).toBe('Test message');
  });
});
