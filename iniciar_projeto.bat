@echo off
chcp 1252 >nul
title Portal de Pendencias Docentes - PUCPR
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar_projeto.ps1"
